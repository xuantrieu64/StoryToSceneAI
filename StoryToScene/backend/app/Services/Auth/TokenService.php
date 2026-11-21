<?php

namespace App\Services\Auth;

use App\Models\RefreshToken;
use App\Models\User;
use Carbon\Carbon;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use LogicException;
use RuntimeException;
use stdClass;
use Symfony\Component\HttpFoundation\Cookie;
use Throwable;

class TokenService
{
    public const SESSIONS_VALID_AFTER_CACHE_PREFIX = 'auth:sessions-valid-after:';

    private const TWO_FACTOR_CACHE_PREFIX = 'auth:two-factor:';

    private const TWO_FACTOR_ATTEMPTS_CACHE_PREFIX = 'auth:two-factor-attempts:';

    private const ACCESS_REVOKED_CACHE_PREFIX = 'auth:access-revoked:';

    private const REFRESH_REUSE_GRACE_SECONDS = 15;

    private const MAX_TWO_FACTOR_FAILURES = 5;

    /**
     * @return array{access_token: string, expires_in: int, refresh_token_plain: string}
     */
    public function issueTokens(User $user, Request $request, ?string $familyId = null): array
    {
        return DB::transaction(function () use ($user, $request, $familyId): array {
            $user->forceFill([
                'last_login_at' => now(),
                'last_login_ip' => $request->ip(),
            ])->save();

            $familyId ??= (string) Str::uuid();
            $familyExpiresAt = $this->familyExpiration($familyId);
            $now = now();

            if ($familyExpiresAt->lte($now)) {
                throw $this->invalidRefreshToken();
            }

            $expiresAt = $now->copy()->addDays((int) config('auth_tokens.refresh_ttl_days', 7));
            if ($expiresAt->gt($familyExpiresAt)) {
                $expiresAt = $familyExpiresAt->copy();
            }

            $accessExpiresAt = time() + ((int) config('auth_tokens.access_ttl_minutes', 10) * 60);
            $accessToken = $this->encodeClaims($user, 'access', $accessExpiresAt);
            $refreshToken = bin2hex(random_bytes(64));

            RefreshToken::query()->create([
                'user_id' => $user->getKey(),
                'family_id' => $familyId,
                'token_hash' => hash('sha256', $refreshToken),
                'user_agent' => $request->userAgent() === null
                    ? null
                    : mb_substr($request->userAgent(), 0, 500),
                'ip_address' => $request->ip(),
                'expires_at' => $expiresAt,
                'family_expires_at' => $familyExpiresAt,
                'used_at' => null,
                'revoked_at' => null,
                'replaced_by' => null,
                'created_at' => $now,
            ]);

            return [
                'access_token' => $accessToken,
                'expires_in' => max(0, $accessExpiresAt - time()),
                'refresh_token_plain' => $refreshToken,
            ];
        });
    }

    public function makeRefreshCookie(string $plain): Cookie
    {
        return cookie()->make(
            'refresh_token',
            $plain,
            (int) config('auth_tokens.refresh_ttl_days', 7) * 1440,
            (string) config('auth_tokens.cookie_path', '/api/v1/auth'),
            null,
            (bool) config('auth_tokens.cookie_secure', false),
            true,
            false,
            (string) config('auth_tokens.cookie_same_site', 'lax'),
        );
    }

    public function forgetRefreshCookie(): Cookie
    {
        return cookie()->forget(
            'refresh_token',
            (string) config('auth_tokens.cookie_path', '/api/v1/auth'),
        );
    }

    /**
     * @return array{user: User, access_token: string, expires_in: int, refresh_token_plain: string}
     */
    public function refresh(
        string $plain,
        Request $request,
        ?int $expectedUserId = null,
        bool $revokeOtherFamilies = false,
    ): array {
        $failure = null;
        $result = DB::transaction(function () use ($plain, $request, $expectedUserId, $revokeOtherFamilies, &$failure, ): ?array {
            $stored = RefreshToken::query()
                ->where('token_hash', hash('sha256', $plain))
                ->lockForUpdate()
                ->first();

            if ($stored === null) {
                $failure = AuthErrorCode::TOKEN_INVALID;

                return null;
            }

            if ($expectedUserId !== null && (int) $stored->user_id !== $expectedUserId) {
                $failure = AuthErrorCode::TOKEN_INVALID;

                return null;
            }

            if ($stored->revoked_at !== null || $stored->used_at !== null) {
                if (!$this->isWithinReuseGrace($stored)) {
                    $this->revokeFamily($stored->family_id);
                }

                $failure = AuthErrorCode::TOKEN_INVALID;

                return null;
            }

            $familyExpiresAt = $this->familyExpiration($stored->family_id);

            if (
                $stored->expires_at === null
                || now()->gte($stored->expires_at)
                || now()->gte($familyExpiresAt)
            ) {
                $this->revokeFamily($stored->family_id);
                $failure = AuthErrorCode::TOKEN_INVALID;

                return null;
            }

            $user = User::query()->find($stored->user_id);
            if ($user === null) {
                $this->revokeFamily($stored->family_id);
                $failure = AuthErrorCode::TOKEN_INVALID;

                return null;
            }

            $stored->forceFill([
                'used_at' => now(),
                'revoked_at' => now(),
            ])->save();

            $issued = $this->issueTokens($user, $request, $stored->family_id);
            $replacement = RefreshToken::query()
                ->where('token_hash', hash('sha256', $issued['refresh_token_plain']))
                ->firstOrFail();

            $stored->forceFill(['replaced_by' => $replacement->getKey()])->save();

            if ($revokeOtherFamilies) {
                RefreshToken::query()
                    ->where('user_id', $user->getKey())
                    ->where('family_id', '!=', $stored->family_id)
                    ->whereNull('revoked_at')
                    ->update(['revoked_at' => now()]);
            }

            return [
                'user' => $user,
                'access_token' => $issued['access_token'],
                'expires_in' => $issued['expires_in'],
                'refresh_token_plain' => $issued['refresh_token_plain'],
            ];
        });

        if ($failure !== null) {
            throw $this->invalidRefreshToken();
        }

        if (!is_array($result)) {
            throw new RuntimeException('Không thể xoay vòng refresh token.');
        }

        return $result;
    }

    public function assertRefreshTokenUsableForUser(string $plain, int $userId): void
    {
        $isUsable = DB::transaction(function () use ($plain, $userId): bool {
            $stored = RefreshToken::query()
                ->where('token_hash', hash('sha256', $plain))
                ->lockForUpdate()
                ->first();

            if ($stored === null || (int) $stored->user_id !== $userId) {
                return false;
            }

            if ($stored->revoked_at !== null || $stored->used_at !== null) {
                return false;
            }

            return $stored->expires_at !== null
                && now()->lt($stored->expires_at)
                && now()->lt($this->familyExpiration($stored->family_id))
                && User::query()->whereKey($userId)->exists();
        });

        if (!$isUsable) {
            throw $this->invalidRefreshToken();
        }
    }

    public function revoke(string $plain): void
    {
        DB::transaction(function () use ($plain): void {
            $stored = RefreshToken::query()
                ->where('token_hash', hash('sha256', $plain))
                ->lockForUpdate()
                ->first();

            if ($stored !== null) {
                $this->revokeFamily($stored->family_id);
            }
        });
    }

    public function revokeAllForUser(User $user): void
    {
        DB::transaction(function () use ($user): void {
            RefreshToken::query()
                ->where('user_id', $user->getKey())
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);

            $user->forceFill(['sessions_valid_after' => now()])->save();
            Cache::forget(self::sessionsValidAfterCacheKey($user->getKey()));
        });
    }

    public function issueTwoFactorToken(User $user): string
    {
        $expiresAt = time() + ((int) config('auth_tokens.two_factor_ttl_minutes', 5) * 60);
        $jti = bin2hex(random_bytes(16));
        $token = $this->encodeClaims($user, '2fa', $expiresAt, $jti);
        $ttl = max(1, $expiresAt - time());

        Cache::put(self::TWO_FACTOR_CACHE_PREFIX . $jti, (string) $user->getKey(), $ttl);

        return $token;
    }

    public function parseTwoFactorToken(string $token): User
    {
        $claims = $this->decodeClaims($token);

        if ($claims->scope !== '2fa') {
            throw $this->invalidAccessToken();
        }

        $activeUserId = Cache::get(self::TWO_FACTOR_CACHE_PREFIX . $claims->jti);
        if (!is_string($activeUserId) || !hash_equals($activeUserId, $claims->sub)) {
            throw $this->invalidAccessToken();
        }

        $user = User::query()->find($claims->sub);
        if ($user === null) {
            Cache::forget(self::TWO_FACTOR_CACHE_PREFIX . $claims->jti);
            throw $this->invalidAccessToken();
        }

        return $user;
    }

    public function consumeTwoFactorToken(string $token): void
    {
        $claims = $this->decodeClaims($token);

        if ($claims->scope !== '2fa') {
            throw $this->invalidAccessToken();
        }

        Cache::forget(self::TWO_FACTOR_CACHE_PREFIX . $claims->jti);
        Cache::forget(self::TWO_FACTOR_ATTEMPTS_CACHE_PREFIX . $claims->jti);
    }

    public function incrementTwoFactorFailure(string $token): int
    {
        $claims = $this->decodeClaims($token);

        if ($claims->scope !== '2fa' || !Cache::has(self::TWO_FACTOR_CACHE_PREFIX . $claims->jti)) {
            throw $this->invalidAccessToken();
        }

        $attemptsKey = self::TWO_FACTOR_ATTEMPTS_CACHE_PREFIX . $claims->jti;
        $ttl = max(1, $claims->exp - time());
        Cache::add($attemptsKey, 0, $ttl);
        $attempts = Cache::increment($attemptsKey);

        if ($attempts > self::MAX_TWO_FACTOR_FAILURES) {
            Cache::forget(self::TWO_FACTOR_CACHE_PREFIX . $claims->jti);
            Cache::forget($attemptsKey);
        }

        return $attempts;
    }

    public function parseAccessToken(string $jwt): stdClass
    {
        $claims = $this->decodeClaims($jwt);

        if ($claims->scope !== 'access') {
            throw $this->invalidAccessToken();
        }

        return $claims;
    }

    public function isAccessTokenRevoked(string $jti): bool
    {
        return Cache::has(self::ACCESS_REVOKED_CACHE_PREFIX . $jti);
    }

    public function revokeAccessToken(string $jti, int $expiresAt): void
    {
        Cache::put(
            self::ACCESS_REVOKED_CACHE_PREFIX . $jti,
            true,
            max(1, $expiresAt - time()),
        );
    }

    public static function sessionsValidAfterCacheKey(int|string $userId): string
    {
        return self::SESSIONS_VALID_AFTER_CACHE_PREFIX . $userId;
    }

    private function familyExpiration(string $familyId): Carbon
    {
        $existing = RefreshToken::query()
            ->where('family_id', $familyId)
            ->orderBy('id')
            ->value('family_expires_at');

        return $existing === null
            ? now()->addDays((int) config('auth_tokens.family_ttl_days', 30))
            : Carbon::parse($existing);
    }

    private function encodeClaims(User $user, string $scope, int $expiresAt, ?string $jti = null): string
    {
        return JWT::encode([
            'sub' => (string) $user->getKey(),
            'iat' => time(),
            'exp' => $expiresAt,
            'jti' => $jti ?? bin2hex(random_bytes(16)),
            'role' => (string) $user->role,
            'scope' => $scope,
        ], $this->secret(), 'HS256');
    }

    private function decodeClaims(string $jwt): stdClass
    {
        try {
            $claims = JWT::decode($jwt, new Key($this->secret(), 'HS256'));
        } catch (ExpiredException) {
            throw new AuthException(
                AuthErrorCode::TOKEN_EXPIRED,
                'Token đã hết hạn.',
                401,
            );
        } catch (Throwable) {
            throw $this->invalidAccessToken();
        }

        if (
            !isset($claims->sub, $claims->iat, $claims->exp, $claims->jti, $claims->role, $claims->scope)
            || !is_string($claims->sub)
            || !ctype_digit($claims->sub)
            || !is_int($claims->iat)
            || !is_int($claims->exp)
            || !is_string($claims->jti)
            || !is_string($claims->role)
            || !is_string($claims->scope)
        ) {
            throw $this->invalidAccessToken();
        }

        return $claims;
    }

    private function isWithinReuseGrace(RefreshToken $token): bool
    {
        return $token->replaced_by !== null
            && $token->used_at !== null
            && Carbon::parse($token->used_at)->gt(now()->subSeconds(self::REFRESH_REUSE_GRACE_SECONDS));
    }

    private function revokeFamily(string $familyId): void
    {
        RefreshToken::query()
            ->where('family_id', $familyId)
            ->whereNull('revoked_at')
            ->update(['revoked_at' => now()]);
    }

    private function secret(): string
    {
        $configuredSecret = (string) config('auth_tokens.jwt_secret');

        if (str_starts_with($configuredSecret, 'base64:')) {
            $decoded = base64_decode(substr($configuredSecret, 7), true);

            if ($decoded === false || $decoded === '') {
                throw new LogicException('JWT_SECRET không hợp lệ.');
            }

            return $decoded;
        }

        if ($configuredSecret === '') {
            throw new LogicException('JWT_SECRET chưa được cấu hình.');
        }

        if (strlen($configuredSecret) < 32) {
            throw new LogicException('JWT_SECRET phải có ít nhất 32 byte khi sử dụng HS256.');
        }

        return $configuredSecret;
    }

    private function invalidAccessToken(): AuthException
    {
        return new AuthException(AuthErrorCode::TOKEN_INVALID, 'Token không hợp lệ.', 401);
    }

    private function invalidRefreshToken(): AuthException
    {
        return new AuthException(AuthErrorCode::TOKEN_INVALID, 'Refresh token không hợp lệ.', 401);
    }
}
