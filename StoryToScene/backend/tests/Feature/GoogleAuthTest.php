<?php

namespace Tests\Feature;

use App\Jobs\SendOtpMailJob;
use App\Models\RefreshToken;
use App\Models\User;
use App\Services\Auth\TokenService;
use Google\Client;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Queue;
use Mockery;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    private const JWT_SECRET = '0123456789abcdef0123456789abcdef';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'auth_tokens.jwt_secret' => self::JWT_SECRET,
            'services.google.client_id' => 'google-client-id',
        ]);
    }

    public function test_google_login_creates_user_and_credit_wallet(): void
    {
        $this->mockGoogleClient($this->payload());

        $response = $this->postJson('/api/v1/auth/google', ['credential' => 'signed-id-token'])
            ->assertOk()
            ->assertCookie('refresh_token')
            ->assertJsonStructure(['access_token', 'expires_in', 'user' => ['id', 'email', 'wallet']]);

        $user = User::query()->where('google_id', 'google-subject-1')->firstOrFail();
        $this->assertSame($user->getKey(), $response->json('user.id'));
        $this->assertSame('google@example.com', $user->email);
        $this->assertSame('Google User', $user->name);
        $this->assertSame('https://example.test/avatar.jpg', $user->avatar_url);
        $this->assertNotNull($user->email_verified_at);
        $this->assertNull($user->password);
        $this->assertSame(0, $user->creditWallet->balance_available);
        $this->assertSame(0, $user->creditWallet->balance_held);
    }

    public function test_google_id_match_reuses_existing_user(): void
    {
        $user = User::factory()->create([
            'google_id' => 'google-subject-1',
            'email_verified_at' => now(),
        ]);
        $this->mockGoogleClient($this->payload());

        $this->postJson('/api/v1/auth/google', ['credential' => 'signed-id-token'])
            ->assertOk()
            ->assertJsonPath('user.id', $user->getKey());

        $this->assertSame(1, User::query()->where('google_id', 'google-subject-1')->count());
    }

    public function test_verified_existing_email_is_linked_without_replacing_password(): void
    {
        $user = User::factory()->create([
            'email' => 'google@example.com',
            'email_verified_at' => now(),
            'avatar_url' => null,
        ]);
        $this->mockGoogleClient($this->payload());

        $this->postJson('/api/v1/auth/google', ['credential' => 'signed-id-token'])
            ->assertOk()
            ->assertJsonPath('user.id', $user->getKey());

        $user->refresh();
        $this->assertSame('google-subject-1', $user->google_id);
        $this->assertSame('https://example.test/avatar.jpg', $user->avatar_url);
        $this->assertTrue(Hash::check('password', $user->password));
    }

    public function test_pending_email_account_is_secured_before_google_verification(): void
    {
        $user = User::factory()->create([
            'email' => 'google@example.com',
            'email_verified_at' => null,
        ]);
        $refreshToken = app(TokenService::class)->issueTokens($user, request())['refresh_token_plain'];
        $this->mockGoogleClient($this->payload());

        $this->postJson('/api/v1/auth/google', ['credential' => 'signed-id-token'])->assertOk();

        $user->refresh();
        $this->assertNull($user->password);
        $this->assertSame('google-subject-1', $user->google_id);
        $this->assertNotNull($user->email_verified_at);
        $this->assertNotNull($user->sessions_valid_after);
        $this->assertNotNull(
            RefreshToken::query()
                ->where('token_hash', hash('sha256', $refreshToken))
                ->value('revoked_at'),
        );
    }

    public function test_unverified_google_email_and_wrong_audience_are_rejected(): void
    {
        $this->mockGoogleClient(
            $this->payload(['email_verified' => false]),
            $this->payload(['aud' => 'another-client-id']),
        );
        $this->postJson('/api/v1/auth/google', ['credential' => 'signed-id-token'])
            ->assertUnauthorized()
            ->assertJsonPath('code', 'invalid_credentials');

        $this->postJson('/api/v1/auth/google', ['credential' => 'signed-id-token'])
            ->assertUnauthorized()
            ->assertJsonPath('code', 'invalid_credentials');

        $this->assertSame(0, User::query()->count());
    }

    public function test_google_login_rejects_expired_or_invalid_signature_payloads(): void
    {
        $this->mockGoogleClient(
            $this->payload(['exp' => time() - 1]),
            false,
            $this->payload(['iss' => 'https://accounts.evil.test']),
        );
        $this->postJson('/api/v1/auth/google', ['credential' => 'signed-id-token'])
            ->assertUnauthorized()
            ->assertJsonPath('code', 'invalid_credentials');

        $this->postJson('/api/v1/auth/google', ['credential' => 'signed-id-token'])
            ->assertUnauthorized()
            ->assertJsonPath('code', 'invalid_credentials');

        $this->postJson('/api/v1/auth/google', ['credential' => 'signed-id-token'])
            ->assertUnauthorized()
            ->assertJsonPath('code', 'invalid_credentials');
    }

    public function test_soft_deleted_google_account_is_rejected_with_forbidden(): void
    {
        $user = User::factory()->create([
            'google_id' => 'google-subject-1',
            'email' => 'google@example.com',
        ]);
        $user->delete();
        $this->mockGoogleClient($this->payload());

        $this->postJson('/api/v1/auth/google', ['credential' => 'signed-id-token'])
            ->assertForbidden()
            ->assertJsonPath('code', 'account_deleted');
    }

    public function test_google_user_with_two_factor_enabled_receives_two_factor_challenge(): void
    {
        Queue::fake();
        $user = User::factory()->create([
            'google_id' => 'google-subject-1',
            'email' => 'google@example.com',
            'email_verified_at' => now(),
            'two_factor_enabled_at' => now(),
        ]);
        $this->mockGoogleClient($this->payload());

        $response = $this->postJson('/api/v1/auth/google', ['credential' => 'signed-id-token'])
            ->assertAccepted()
            ->assertJsonPath('requires_2fa', true)
            ->assertJsonStructure(['two_factor_token']);

        $this->assertArrayNotHasKey('access_token', $response->json());
        $this->assertNull($response->getCookie('refresh_token', false));
        $job = Queue::pushed(SendOtpMailJob::class)->first();
        $this->assertInstanceOf(SendOtpMailJob::class, $job);
        $this->assertSame('login_2fa', $job->purpose);
        $this->assertSame($user->email, $job->email);
    }

    /**
     * @param  array<string, mixed>|false  $payload
     * @param  array<string, mixed>|false  ...$additionalPayloads
     */
    private function mockGoogleClient(array|false $payload, array|false ...$additionalPayloads): void
    {
        $responses = [$payload, ...$additionalPayloads];
        $client = Mockery::mock(Client::class);
        $client->shouldReceive('verifyIdToken')
            ->with('signed-id-token')
            ->times(count($responses))
            ->andReturn(...$responses);

        $this->app->instance(Client::class, $client);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'aud' => 'google-client-id',
            'iss' => 'https://accounts.google.com',
            'exp' => time() + 3600,
            'email_verified' => true,
            'sub' => 'google-subject-1',
            'email' => 'google@example.com',
            'name' => 'Google User',
            'picture' => 'https://example.test/avatar.jpg',
        ], $overrides);
    }
}
