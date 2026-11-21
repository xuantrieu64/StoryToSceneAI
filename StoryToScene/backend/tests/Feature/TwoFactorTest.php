<?php

namespace Tests\Feature;

use App\Jobs\SendOtpMailJob;
use App\Mail\SecurityAlertMail;
use App\Models\RefreshToken;
use App\Models\User;
use App\Services\Auth\TokenService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class TwoFactorTest extends TestCase
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

    public function test_two_factor_can_be_enabled_and_recovery_codes_are_hashed(): void
    {
        Queue::fake();
        $user = User::factory()->create(['email_verified_at' => now()]);

        $this->withToken($this->issueSession($user)['access_token'])
            ->postJson('/api/v1/auth/2fa/enable/request', ['password' => 'password'])
            ->assertAccepted();

        $otp = $this->queuedOtp();
        $response = $this->withToken($this->issueSession($user)['access_token'])
            ->postJson('/api/v1/auth/2fa/enable/confirm', ['otp' => $otp])
            ->assertOk()
            ->assertJsonCount(8, 'recovery_codes');

        $plainCodes = $response->json('recovery_codes');
        foreach ($plainCodes as $code) {
            $this->assertMatchesRegularExpression('/^[a-z0-9]{4}-[a-z0-9]{4}$/', $code);
        }

        $user->refresh();
        $this->assertTrue($user->hasTwoFactorEnabled());
        $this->assertCount(8, $user->two_factor_recovery_codes);
        $this->assertNotContains($plainCodes[0], $user->two_factor_recovery_codes);
        $this->assertTrue(Hash::check($plainCodes[0], $user->two_factor_recovery_codes[0]));

        $this->withToken($this->issueSession($user)['access_token'])
            ->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('user.two_factor_enabled', true)
            ->assertJsonPath('user.two_factor_recovery_codes_remaining', 8)
            ->assertJsonMissingPath('user.two_factor_recovery_codes');
    }

    public function test_enable_requires_correct_password_and_rejects_already_enabled_users(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $accessToken = $this->issueSession($user)['access_token'];

        $this->withToken($accessToken)
            ->postJson('/api/v1/auth/2fa/enable/request', ['password' => 'wrong'])
            ->assertUnauthorized()
            ->assertJsonPath('code', 'invalid_credentials');

        $user->forceFill(['two_factor_enabled_at' => now()])->save();
        $this->withToken($accessToken)
            ->postJson('/api/v1/auth/2fa/enable/request', ['password' => 'password'])
            ->assertStatus(409)
            ->assertJsonPath('code', 'two_factor_already_enabled');
    }

    public function test_enable_confirmation_rejects_invalid_otp(): void
    {
        Queue::fake();
        $user = User::factory()->create(['email_verified_at' => now()]);

        $this->withToken($this->issueSession($user)['access_token'])
            ->postJson('/api/v1/auth/2fa/enable/request', ['password' => 'password'])
            ->assertAccepted();

        $otp = $this->queuedOtp();
        $this->withToken($this->issueSession($user)['access_token'])
            ->postJson('/api/v1/auth/2fa/enable/confirm', ['otp' => $this->wrongOtp($otp)])
            ->assertUnprocessable()
            ->assertJsonPath('code', 'otp_invalid');

        $this->assertFalse($user->fresh()->hasTwoFactorEnabled());
    }

    public function test_two_factor_login_supports_otp_and_rejects_reuse_or_missing_otp(): void
    {
        Queue::fake();
        $user = $this->twoFactorUser();
        $login = $this->loginForTwoFactor($user);
        $twoFactorToken = $login->json('two_factor_token');

        $this->postJson('/api/v1/auth/2fa/verify', ['two_factor_token' => $twoFactorToken])
            ->assertUnprocessable()
            ->assertJsonPath('code', 'validation_error');

        $this->postJson('/api/v1/auth/2fa/verify', [
            'two_factor_token' => $twoFactorToken,
            'otp' => '123456',
            'recovery_code' => 'abcd-1234',
        ])->assertUnprocessable()
            ->assertJsonPath('code', 'validation_error');

        $otp = $this->queuedOtp();
        $this->postJson('/api/v1/auth/2fa/verify', [
            'two_factor_token' => $twoFactorToken,
            'otp' => $this->wrongOtp($otp),
        ])->assertUnprocessable()
            ->assertJsonPath('code', 'otp_invalid');

        $verified = $this->postJson('/api/v1/auth/2fa/verify', [
            'two_factor_token' => $twoFactorToken,
            'otp' => $otp,
        ])->assertOk()
            ->assertCookie('refresh_token')
            ->assertJsonStructure(['access_token', 'expires_in', 'user']);

        $this->postJson('/api/v1/auth/2fa/verify', [
            'two_factor_token' => $twoFactorToken,
            'otp' => $otp,
        ])->assertUnauthorized()
            ->assertJsonPath('code', 'token_invalid');

        $this->withToken($login->json('two_factor_token'))->getJson('/api/v1/me')
            ->assertUnauthorized()
            ->assertJsonPath('code', 'token_invalid');

        $this->assertNotEmpty($verified->json('access_token'));
    }

    public function test_two_factor_otp_resend_uses_the_pending_token_and_cooldown(): void
    {
        Queue::fake();
        $user = $this->twoFactorUser();
        $twoFactorToken = $this->loginForTwoFactor($user)->json('two_factor_token');

        $this->postJson('/api/v1/auth/2fa/resend', ['two_factor_token' => $twoFactorToken])
            ->assertStatus(429)
            ->assertJsonPath('code', 'otp_throttled');

        $this->travel(61)->seconds();
        $this->postJson('/api/v1/auth/2fa/resend', ['two_factor_token' => $twoFactorToken])
            ->assertAccepted();

        $jobs = Queue::pushed(SendOtpMailJob::class);
        $this->assertCount(2, $jobs);
        $this->assertSame('login_2fa', $jobs->last()->purpose);
    }

    public function test_two_factor_token_is_invalidated_after_more_than_five_wrong_attempts(): void
    {
        Queue::fake();
        $user = $this->twoFactorUser();
        $twoFactorToken = $this->loginForTwoFactor($user)->json('two_factor_token');
        $otp = $this->queuedOtp();
        $wrongOtp = $this->wrongOtp($otp);

        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->postJson('/api/v1/auth/2fa/verify', [
                'two_factor_token' => $twoFactorToken,
                'otp' => $wrongOtp,
            ])->assertUnprocessable()
                ->assertJsonPath('code', 'otp_invalid');
        }

        $this->postJson('/api/v1/auth/2fa/verify', [
            'two_factor_token' => $twoFactorToken,
            'otp' => $wrongOtp,
        ])->assertUnauthorized()
            ->assertJsonPath('code', 'token_invalid');
    }

    public function test_recovery_code_can_only_be_used_once_and_sends_security_alert(): void
    {
        Queue::fake();
        Mail::fake();
        $recoveryCode = 'abcd-1234';
        $user = $this->twoFactorUser([$recoveryCode]);
        $twoFactorToken = $this->loginForTwoFactor($user)->json('two_factor_token');

        $this->postJson('/api/v1/auth/2fa/verify', [
            'two_factor_token' => $twoFactorToken,
            'recovery_code' => $recoveryCode,
        ])->assertOk();

        $this->assertCount(0, $user->fresh()->two_factor_recovery_codes);
        Mail::assertQueued(SecurityAlertMail::class, fn (SecurityAlertMail $mail): bool => (
            $mail->event === SecurityAlertMail::RECOVERY_CODE_USED
        ));

        $newTwoFactorToken = app(TokenService::class)->issueTwoFactorToken($user->fresh());
        $this->postJson('/api/v1/auth/2fa/verify', [
            'two_factor_token' => $newTwoFactorToken,
            'recovery_code' => $recoveryCode,
        ])->assertUnprocessable()
            ->assertJsonPath('code', 'otp_invalid');
    }

    public function test_disable_revokes_other_sessions_and_returns_tokens_for_current_session(): void
    {
        Queue::fake();
        Mail::fake();
        $user = $this->twoFactorUser(['usec-1234']);
        $tokens = app(TokenService::class);
        $currentSession = $tokens->issueTokens($user, request());
        $otherSession = $tokens->issueTokens($user, request());

        $this->withToken($currentSession['access_token'])
            ->postJson('/api/v1/auth/2fa/disable/request', ['password' => 'password'])
            ->assertAccepted();

        sleep(2);
        $response = $this->withToken($currentSession['access_token'])
            ->withCredentials()
            ->withUnencryptedCookie('refresh_token', $currentSession['refresh_token_plain'])
            ->postJson('/api/v1/auth/2fa/disable/confirm', ['otp' => $this->queuedOtp()])
            ->assertOk()
            ->assertCookie('refresh_token')
            ->assertJsonPath('user.two_factor_enabled', false)
            ->assertJsonPath('user.two_factor_recovery_codes_remaining', 0);

        $user->refresh();
        $this->assertNull($user->two_factor_enabled_at);
        $this->assertNull($user->two_factor_recovery_codes);
        $this->assertNotNull($user->sessions_valid_after);
        $this->assertNotNull(
            RefreshToken::query()
                ->where('token_hash', hash('sha256', $otherSession['refresh_token_plain']))
                ->value('revoked_at'),
        );
        $replacementCookie = $response->getCookie('refresh_token', false);
        $this->assertNotNull($replacementCookie);
        $this->assertNotSame($currentSession['refresh_token_plain'], $replacementCookie->getValue());
        $this->assertDatabaseHas('refresh_tokens', [
            'token_hash' => hash('sha256', $replacementCookie->getValue()),
            'revoked_at' => null,
        ]);

        $this->withToken($currentSession['access_token'])->getJson('/api/v1/me')
            ->assertUnauthorized()
            ->assertJsonPath('code', 'token_invalid');
        $this->withToken($response->json('access_token'))->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('user.two_factor_enabled', false);

        Mail::assertQueued(SecurityAlertMail::class, fn (SecurityAlertMail $mail): bool => (
            $mail->event === SecurityAlertMail::TWO_FACTOR_DISABLED
        ));
    }

    public function test_recovery_code_regeneration_uses_two_steps_and_replaces_old_codes(): void
    {
        Queue::fake();
        $oldCode = 'oldc-1234';
        $user = $this->twoFactorUser([$oldCode]);
        $accessToken = $this->issueSession($user)['access_token'];

        $this->withToken($accessToken)
            ->postJson('/api/v1/auth/2fa/recovery-codes/regenerate', ['password' => 'password'])
            ->assertAccepted();

        $this->assertSame('regenerate_codes', Queue::pushed(SendOtpMailJob::class)->last()->purpose);
        $response = $this->withToken($accessToken)
            ->postJson('/api/v1/auth/2fa/recovery-codes/regenerate', [
                'password' => 'password',
                'otp' => $this->queuedOtp(),
            ])
            ->assertOk()
            ->assertJsonCount(8, 'recovery_codes');

        $this->assertCount(8, $user->fresh()->two_factor_recovery_codes);
        $this->assertFalse(Hash::check($oldCode, $user->fresh()->two_factor_recovery_codes[0]));
        $this->assertCount(8, $response->json('recovery_codes'));
    }

    public function test_passwordless_user_must_have_logged_in_within_ten_minutes(): void
    {
        Queue::fake();
        $user = User::factory()->create([
            'email_verified_at' => now(),
            'password' => null,
            'last_login_at' => now()->subMinutes(11),
        ]);
        $accessToken = $this->issueSession($user)['access_token'];
        $user->forceFill(['password' => null, 'last_login_at' => now()->subMinutes(11)])->save();

        $this->withToken($accessToken)
            ->postJson('/api/v1/auth/2fa/enable/request')
            ->assertForbidden()
            ->assertJsonPath('code', 'recent_authentication_required');

        $user->forceFill(['last_login_at' => now()->subMinutes(9)])->save();
        $this->withToken($accessToken)
            ->postJson('/api/v1/auth/2fa/enable/request')
            ->assertAccepted();
    }

    /**
     * @param  list<string>  $recoveryCodes
     */
    private function twoFactorUser(array $recoveryCodes = []): User
    {
        return User::factory()->create([
            'email_verified_at' => now(),
            'two_factor_enabled_at' => now(),
            'two_factor_recovery_codes' => array_map(
                static fn (string $code): string => Hash::make($code),
                $recoveryCodes,
            ),
        ]);
    }

    /**
     * @return array{access_token: string, expires_in: int, refresh_token_plain: string}
     */
    private function issueSession(User $user): array
    {
        return app(TokenService::class)->issueTokens($user, request());
    }

    private function loginForTwoFactor(User $user): TestResponse
    {
        return $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertAccepted()
            ->assertJsonPath('requires_2fa', true);
    }

    private function queuedOtp(): string
    {
        $job = Queue::pushed(SendOtpMailJob::class)->last();
        $this->assertInstanceOf(SendOtpMailJob::class, $job);

        return $job->otp;
    }

    private function wrongOtp(string $otp): string
    {
        return $otp === '000000' ? '000001' : '000000';
    }
}
