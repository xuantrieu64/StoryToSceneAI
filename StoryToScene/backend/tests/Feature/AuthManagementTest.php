<?php

namespace Tests\Feature;

use App\Jobs\SendOtpMailJob;
use App\Models\RefreshToken;
use App\Models\User;
use App\Services\Auth\TokenService;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Queue;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class AuthManagementTest extends TestCase
{
    use RefreshDatabase;

    private const JWT_SECRET = '0123456789abcdef0123456789abcdef';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'auth_tokens.jwt_secret' => self::JWT_SECRET,
            'cors.allowed_origins' => ['https://spa.example.test'],
        ]);
    }

    public function test_register_verify_email_creates_wallet_and_returns_access_token_cookie_only(): void
    {
        Queue::fake();

        $this->postJson('/api/v1/auth/register', $this->registrationData('new@example.com'))
            ->assertAccepted()
            ->assertJsonPath('email', 'new@example.com')
            ->assertJsonMissingPath('access_token');

        $otp = $this->queuedOtp();
        $response = $this->postJson('/api/v1/auth/verify-email', [
            'email' => 'new@example.com',
            'otp' => $otp,
        ]);

        $response->assertOk()
            ->assertCookie('refresh_token')
            ->assertJsonStructure(['access_token', 'expires_in', 'user' => ['id', 'email', 'wallet']]);
        $this->assertSame(['access_token', 'expires_in', 'user'], array_keys($response->json()));
        $this->assertArrayNotHasKey('refresh_token', $response->json());
        $this->assertArrayNotHasKey('google_id', $response->json('user'));
        $this->assertArrayNotHasKey('last_login_ip', $response->json('user'));
        $this->assertArrayNotHasKey('two_factor_recovery_codes', $response->json('user'));

        $user = User::query()->where('email', 'new@example.com')->firstOrFail();
        $this->assertNotNull($user->email_verified_at);
        $this->assertSame(0, $user->creditWallet->balance_available);
        $this->assertSame(0, $user->creditWallet->balance_held);

        $plainRefresh = $this->cookieValue($response);
        $this->assertSame(
            hash('sha256', $plainRefresh),
            RefreshToken::query()->where('user_id', $user->getKey())->value('token_hash'),
        );
        $this->assertNotSame($plainRefresh, RefreshToken::query()->value('token_hash'));
    }

    public function test_re_registering_unverified_email_updates_user_and_resends_otp(): void
    {
        Queue::fake();

        $this->postJson('/api/v1/auth/register', $this->registrationData('pending@example.com'))
            ->assertAccepted();

        $this->travel(61)->seconds();
        $this->postJson('/api/v1/auth/register', $this->registrationData(
            'pending@example.com',
            'Updated Name',
            'UpdatedStrong456!',
        ))->assertAccepted();

        $user = User::query()->where('email', 'pending@example.com')->firstOrFail();
        $this->assertSame('Updated Name', $user->name);
        $this->assertTrue(Hash::check('UpdatedStrong456!', $user->password));
        $this->assertNull($user->email_verified_at);
        $this->assertSame(1, User::query()->where('email', 'pending@example.com')->count());
        $this->assertSame(2, Queue::pushed(SendOtpMailJob::class)->count());

        $this->travel(61)->seconds();
        $this->postJson('/api/v1/auth/resend-otp', [
            'email' => 'pending@example.com',
            'purpose' => 'register',
        ])->assertAccepted();

        $this->postJson('/api/v1/auth/resend-otp', [
            'email' => 'pending@example.com',
            'purpose' => 'disable_2fa',
        ])->assertUnprocessable();
    }

    public function test_verified_email_is_rejected_but_soft_deleted_email_can_register_again(): void
    {
        User::factory()->create(['email' => 'verified@example.com']);

        $this->postJson('/api/v1/auth/register', $this->registrationData('verified@example.com'))
            ->assertUnprocessable()
            ->assertJsonPath('code', 'validation_error')
            ->assertJsonPath('message', 'Dữ liệu gửi lên không hợp lệ.');

        Queue::fake();
        $deleted = User::factory()->create(['email' => 'deleted@example.com']);
        $deleted->delete();

        $this->postJson('/api/v1/auth/register', $this->registrationData('deleted@example.com'))
            ->assertAccepted();

        $this->assertSame(1, User::query()->where('email', 'deleted@example.com')->count());
        $this->assertSame(2, User::withTrashed()->where('email', 'deleted@example.com')->count());
    }

    public function test_login_errors_are_generic_for_invalid_password_and_unverified_user(): void
    {
        $user = User::factory()->create(['email' => 'valid@example.com']);

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'incorrect',
        ])->assertUnauthorized()
            ->assertJsonPath('code', 'invalid_credentials')
            ->assertJsonPath('message', 'Email hoặc mật khẩu không chính xác.');

        $googleUser = User::factory()->create(['email' => 'google-only@example.com']);
        $googleUser->forceFill(['password' => null])->save();
        $this->postJson('/api/v1/auth/login', [
            'email' => $googleUser->email,
            'password' => 'incorrect',
        ])->assertUnauthorized()
            ->assertJsonPath('code', 'invalid_credentials')
            ->assertJsonPath('message', 'Email hoặc mật khẩu không chính xác.');

        $unverified = User::factory()->unverified()->create(['email' => 'unverified@example.com']);
        $this->postJson('/api/v1/auth/login', [
            'email' => $unverified->email,
            'password' => 'password',
        ])->assertForbidden()
            ->assertJsonPath('code', 'email_unverified');
    }

    public function test_successful_login_returns_access_token_and_http_only_refresh_cookie(): void
    {
        $user = User::factory()->create(['email' => 'login@example.com']);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $response->assertOk()
            ->assertCookie('refresh_token')
            ->assertJsonStructure(['access_token', 'expires_in', 'user' => ['id', 'email']]);
        $this->assertSame(['access_token', 'expires_in', 'user'], array_keys($response->json()));
        $this->assertArrayNotHasKey('refresh_token', $response->json());
        $this->assertTrue($response->getCookie('refresh_token', false)->isHttpOnly());
    }

    public function test_login_route_throttles_five_attempts_per_email_and_ip(): void
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/v1/auth/login', [
                'email' => 'throttle@example.com',
                'password' => 'incorrect',
            ])->assertUnauthorized();
        }

        $this->postJson('/api/v1/auth/login', [
            'email' => 'throttle@example.com',
            'password' => 'incorrect',
        ])->assertTooManyRequests()
            ->assertJsonPath('code', 'too_many_requests');
    }

    public function test_refresh_rotates_cookie_and_logout_revokes_the_refresh_family(): void
    {
        $user = User::factory()->create(['email' => 'refresh@example.com']);
        $login = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk();
        $initialRefresh = $this->cookieValue($login);

        $refreshed = $this->withCredentials()
            ->withUnencryptedCookie('refresh_token', $initialRefresh)
            ->withHeaders($this->refreshHeaders())
            ->postJson('/api/v1/auth/refresh')
            ->assertOk()
            ->assertJsonStructure(['access_token', 'expires_in', 'user']);
        $nextRefresh = $this->cookieValue($refreshed);

        $this->assertNotSame($initialRefresh, $nextRefresh);
        $this->assertArrayNotHasKey('refresh_token', $refreshed->json());

        $this->withToken($refreshed->json('access_token'))
            ->withUnencryptedCookie('refresh_token', $nextRefresh)
            ->postJson('/api/v1/auth/logout')
            ->assertOk()
            ->assertCookieExpired('refresh_token');

        $this->withUnencryptedCookie('refresh_token', $nextRefresh)
            ->withHeaders($this->refreshHeaders())
            ->postJson('/api/v1/auth/refresh')
            ->assertUnauthorized()
            ->assertJsonPath('code', 'token_invalid');
    }

    public function test_refresh_rejects_bad_tokens_and_requires_allowed_origin_headers(): void
    {
        $this->withCredentials()
            ->withUnencryptedCookie('refresh_token', 'not-a-token')
            ->withHeaders($this->refreshHeaders())
            ->postJson('/api/v1/auth/refresh')
            ->assertUnauthorized()
            ->assertJsonPath('code', 'token_invalid');

        $this->flushHeaders()
            ->withUnencryptedCookie('refresh_token', 'not-a-token')
            ->postJson('/api/v1/auth/refresh')
            ->assertForbidden()
            ->assertJsonPath('code', 'origin_not_allowed');

        $this->flushHeaders()
            ->withUnencryptedCookie('refresh_token', 'not-a-token')
            ->withHeader('Origin', 'https://spa.example.test')
            ->postJson('/api/v1/auth/refresh')
            ->assertForbidden()
            ->assertJsonPath('code', 'csrf_header_required');
    }

    public function test_me_requires_valid_unexpired_access_token(): void
    {
        $user = User::factory()->create();
        $issued = app(TokenService::class)->issueTokens($user, request());

        $this->getJson('/api/v1/me')
            ->assertUnauthorized()
            ->assertJsonPath('code', 'token_invalid');

        $this->withToken($issued['access_token'])->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('user.id', $user->getKey());

        $expiredJwt = JWT::encode([
            'sub' => (string) $user->getKey(),
            'iat' => time() - 120,
            'exp' => time() - 1,
            'jti' => 'expired-access-token',
            'role' => 'user',
            'scope' => 'access',
        ], self::JWT_SECRET, 'HS256');

        $this->withToken($expiredJwt)->getJson('/api/v1/me')
            ->assertUnauthorized()
            ->assertJsonPath('code', 'token_expired');
    }

    public function test_two_factor_login_only_returns_the_group_five_hook(): void
    {
        Queue::fake();
        $user = User::factory()->create(['email' => 'two-factor@example.com']);
        $user->forceFill(['two_factor_enabled_at' => now()])->save();

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertAccepted()
            ->assertJsonPath('requires_2fa', true)
            ->assertJsonStructure(['two_factor_token']);

        $this->assertArrayNotHasKey('access_token', $response->json());
        $this->assertNull($response->getCookie('refresh_token', false));
    }

    /**
     * @return array{name: string, email: string, password: string, password_confirmation: string}
     */
    private function registrationData(
        string $email,
        string $name = 'New User',
        string $password = 'StrongPass123!',
    ): array {
        return [
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'password_confirmation' => $password,
        ];
    }

    private function queuedOtp(): string
    {
        $otp = null;
        Queue::assertPushed(SendOtpMailJob::class, function (SendOtpMailJob $job) use (&$otp): bool {
            $otp = $job->otp;

            return true;
        });

        $this->assertIsString($otp);

        return $otp;
    }

    private function cookieValue(TestResponse $response): string
    {
        $cookie = $response->getCookie('refresh_token', false);
        $this->assertNotNull($cookie);

        return $cookie->getValue();
    }

    /**
     * @return array{Origin: string, X-Requested-With: string}
     */
    private function refreshHeaders(): array
    {
        return [
            'Origin' => 'https://spa.example.test',
            'X-Requested-With' => 'XMLHttpRequest',
        ];
    }
}
