<?php

namespace Tests\Feature;

use App\Models\RefreshToken;
use App\Models\User;
use App\Services\Auth\AuthException;
use App\Services\Auth\TokenService;
use Firebase\JWT\JWT;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TokenServiceTest extends TestCase
{
    use RefreshDatabase;

    private const TEST_JWT_SECRET = '0123456789abcdef0123456789abcdef';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'auth_tokens.jwt_secret' => self::TEST_JWT_SECRET,
            'auth_tokens.access_ttl_minutes' => 10,
            'auth_tokens.refresh_ttl_days' => 7,
            'auth_tokens.family_ttl_days' => 30,
            'auth_tokens.two_factor_ttl_minutes' => 5,
            'auth_tokens.cookie_path' => '/api/v1/auth',
        ]);
    }

    public function test_issue_tokens_updates_login_metadata_and_stores_only_refresh_hash(): void
    {
        $user = User::factory()->create();
        $request = $this->request();
        $issued = app(TokenService::class)->issueTokens($user, $request);
        $claims = app(TokenService::class)->parseAccessToken($issued['access_token']);
        $stored = RefreshToken::query()->firstOrFail();

        $this->assertSame((string) $user->getKey(), $claims->sub);
        $this->assertSame('access', $claims->scope);
        $this->assertSame(600, $issued['expires_in']);
        $this->assertSame(hash('sha256', $issued['refresh_token_plain']), $stored->token_hash);
        $this->assertNotSame($issued['refresh_token_plain'], $stored->token_hash);
        $this->assertNotNull($stored->family_expires_at);
        $this->assertSame('192.0.2.10', $user->fresh()->last_login_ip);
        $this->assertSame('token-test-agent', $stored->user_agent);
    }

    public function test_access_token_parser_distinguishes_expiry_signature_and_scope_errors(): void
    {
        $user = User::factory()->create();
        $service = app(TokenService::class);
        $claims = [
            'sub' => (string) $user->getKey(),
            'iat' => time() - 20,
            'exp' => time() - 1,
            'jti' => 'expired-jti',
            'role' => 'user',
            'scope' => 'access',
        ];

        $this->assertAuthException('token_expired', fn () => $service->parseAccessToken(
            JWT::encode($claims, self::TEST_JWT_SECRET, 'HS256'),
        ));

        $claims['exp'] = time() + 60;
        $badSignature = JWT::encode($claims, 'fedcba9876543210fedcba9876543210', 'HS256');
        $this->assertAuthException('token_invalid', fn () => $service->parseAccessToken($badSignature));

        $twoFactorToken = $service->issueTwoFactorToken($user);
        $this->assertAuthException('token_invalid', fn () => $service->parseAccessToken($twoFactorToken));
    }

    public function test_refresh_rotates_tokens_and_only_revokes_family_after_reuse_grace(): void
    {
        $user = User::factory()->create();
        $service = app(TokenService::class);
        $request = $this->request();
        $first = $service->issueTokens($user, $request);
        $old = RefreshToken::query()->where('token_hash', hash('sha256', $first['refresh_token_plain']))->firstOrFail();
        $rotated = $service->refresh($first['refresh_token_plain'], $request);
        $successor = RefreshToken::query()
            ->where('token_hash', hash('sha256', $rotated['refresh_token_plain']))
            ->firstOrFail();

        $this->assertSame($old->family_id, $successor->family_id);
        $this->assertSame($old->family_expires_at->timestamp, $successor->family_expires_at->timestamp);
        $this->assertSame($successor->getKey(), $old->fresh()->replaced_by);

        $this->assertAuthException('token_invalid', fn () => $service->refresh($first['refresh_token_plain'], $request));
        $this->assertNull($successor->fresh()->revoked_at);

        $this->travel(16)->seconds();
        $this->assertAuthException('token_invalid', fn () => $service->refresh($first['refresh_token_plain'], $request));
        $this->assertSame(
            2,
            RefreshToken::query()->where('family_id', $old->family_id)->whereNotNull('revoked_at')->count(),
        );
    }

    public function test_expired_tokens_expired_families_and_soft_deleted_users_are_rejected(): void
    {
        $service = app(TokenService::class);
        $request = $this->request();

        $expiredToken = $service->issueTokens(User::factory()->create(), $request);
        DB::table('refresh_tokens')
            ->where('token_hash', hash('sha256', $expiredToken['refresh_token_plain']))
            ->update(['expires_at' => now()->subSecond()]);
        $this->assertAuthException(
            'token_invalid',
            fn () => $service->refresh($expiredToken['refresh_token_plain'], $request),
        );

        $expiredFamily = $service->issueTokens(User::factory()->create(), $request);
        DB::table('refresh_tokens')
            ->where('token_hash', hash('sha256', $expiredFamily['refresh_token_plain']))
            ->update(['family_expires_at' => now()->subSecond()]);
        $this->assertAuthException(
            'token_invalid',
            fn () => $service->refresh($expiredFamily['refresh_token_plain'], $request),
        );

        $deletedUser = User::factory()->create();
        $deletedUserToken = $service->issueTokens($deletedUser, $request);
        $deletedUser->delete();
        $this->assertAuthException(
            'token_invalid',
            fn () => $service->refresh($deletedUserToken['refresh_token_plain'], $request),
        );
    }

    public function test_jwt_middleware_rejects_tokens_issued_before_session_cutoff(): void
    {
        $user = User::factory()->create();
        $issued = app(TokenService::class)->issueTokens($user, $this->request());

        $this->getJson('/api/v1/me')
            ->assertUnauthorized()
            ->assertJsonPath('code', 'token_invalid');

        $this->withToken($issued['access_token'])->getJson('/api/v1/me')->assertOk();

        $user->forceFill(['sessions_valid_after' => now()->addSeconds(1)])->save();

        $this->withToken($issued['access_token'])->getJson('/api/v1/me')
            ->assertUnauthorized()
            ->assertJsonPath('code', 'token_invalid');
    }

    public function test_revoke_all_for_user_revokes_refresh_families_and_invalidates_access_tokens(): void
    {
        $user = User::factory()->create();
        $service = app(TokenService::class);
        $issued = $service->issueTokens($user, $this->request());

        $this->withToken($issued['access_token'])->getJson('/api/v1/me')->assertOk();
        $this->travel(2)->seconds();
        $service->revokeAllForUser($user);

        $this->assertNotNull(RefreshToken::query()->value('revoked_at'));
        $this->withToken($issued['access_token'])->getJson('/api/v1/me')
            ->assertUnauthorized()
            ->assertJsonPath('code', 'token_invalid');
    }

    public function test_two_factor_tokens_are_consumable_once_and_expire_after_six_failures(): void
    {
        $user = User::factory()->create();
        $service = app(TokenService::class);
        $oneTimeToken = $service->issueTwoFactorToken($user);

        $this->assertSame($user->getKey(), $service->parseTwoFactorToken($oneTimeToken)->getKey());
        $service->consumeTwoFactorToken($oneTimeToken);
        $this->assertAuthException('token_invalid', fn () => $service->parseTwoFactorToken($oneTimeToken));

        $limitedToken = $service->issueTwoFactorToken($user);
        for ($attempt = 1; $attempt <= 5; $attempt++) {
            $this->assertSame($attempt, $service->incrementTwoFactorFailure($limitedToken));
            $this->assertSame($user->getKey(), $service->parseTwoFactorToken($limitedToken)->getKey());
        }

        $this->assertSame(6, $service->incrementTwoFactorFailure($limitedToken));
        $this->assertAuthException('token_invalid', fn () => $service->parseTwoFactorToken($limitedToken));
    }

    public function test_refresh_cookie_uses_configured_security_attributes(): void
    {
        config([
            'auth_tokens.cookie_secure' => true,
            'auth_tokens.cookie_same_site' => 'strict',
            'auth_tokens.cookie_path' => '/api/v1/auth',
        ]);

        $cookie = app(TokenService::class)->makeRefreshCookie('plain-refresh-value');

        $this->assertSame('/api/v1/auth', $cookie->getPath());
        $this->assertTrue($cookie->isSecure());
        $this->assertTrue($cookie->isHttpOnly());
        $this->assertSame('strict', $cookie->getSameSite());
        $this->assertSame('plain-refresh-value', $cookie->getValue());
    }

    private function request(): Request
    {
        return Request::create('/', 'GET', [], [], [], [
            'REMOTE_ADDR' => '192.0.2.10',
            'HTTP_USER_AGENT' => 'token-test-agent',
        ]);
    }

    private function assertAuthException(string $code, callable $callback): void
    {
        try {
            $callback();
            $this->fail("Expected auth exception with code [{$code}].");
        } catch (AuthException $exception) {
            $this->assertSame($code, $exception->errorCode);
            $this->assertSame(401, $exception->statusCode);
        }
    }
}
