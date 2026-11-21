<?php

namespace App\Services\Auth;

use App\Models\User;
use Google\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use LogicException;
use UnexpectedValueException;

class GoogleAuthService
{
    public function __construct(
        private readonly Client $googleClient,
        private readonly OtpService $otpService,
        private readonly TokenService $tokens,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function verifyIdToken(string $credential): array
    {
        $clientId = (string) config('services.google.client_id');
        if ($clientId === '') {
            throw $this->invalidCredential();
        }

        try {
            $payload = $this->googleClient->verifyIdToken($credential);
        } catch (LogicException|UnexpectedValueException) {
            throw $this->invalidCredential();
        }

        if (! is_array($payload)) {
            throw $this->invalidCredential();
        }

        $audience = $payload['aud'] ?? null;
        $issuer = $payload['iss'] ?? null;
        $expiration = $payload['exp'] ?? null;

        if (
            $audience !== $clientId
            || ! in_array($issuer, ['accounts.google.com', 'https://accounts.google.com'], true)
            || (! is_int($expiration) && ! (is_string($expiration) && ctype_digit($expiration)))
            || (int) $expiration <= time()
            || ($payload['email_verified'] ?? null) !== true
            || ! is_string($payload['sub'] ?? null)
            || trim($payload['sub']) === ''
            || ! is_string($payload['email'] ?? null)
            || filter_var($payload['email'], FILTER_VALIDATE_EMAIL) === false
        ) {
            throw $this->invalidCredential();
        }

        return $payload;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function findOrCreateUser(array $payload): User
    {
        if (
            ($payload['email_verified'] ?? null) !== true
            || ! is_string($payload['sub'] ?? null)
            || ! is_string($payload['email'] ?? null)
            || filter_var($payload['email'], FILTER_VALIDATE_EMAIL) === false
        ) {
            throw $this->invalidCredential();
        }

        $googleId = trim($payload['sub']);
        $email = mb_strtolower(trim($payload['email']));
        $avatarUrl = $this->avatarUrl($payload['picture'] ?? null);
        $name = $this->name($payload['name'] ?? null, $email);

        return DB::transaction(function () use ($googleId, $email, $avatarUrl, $name): User {
            $user = User::query()
                ->where('google_id', $googleId)
                ->lockForUpdate()
                ->first();

            if ($user !== null) {
                if ($user->email_verified_at === null) {
                    $user->forceFill(['email_verified_at' => now()])->save();
                }

                $this->ensureWallet($user);

                return $user;
            }

            if ($this->deletedUserExists('google_id', $googleId)) {
                throw $this->deletedAccount();
            }

            $user = User::query()
                ->where('email', $email)
                ->lockForUpdate()
                ->first();

            if ($user !== null) {
                if ($user->google_id !== null && ! hash_equals((string) $user->google_id, $googleId)) {
                    throw $this->invalidCredential();
                }

                if ($user->email_verified_at === null) {
                    $user->forceFill(['password' => null])->save();
                    $this->tokens->revokeAllForUser($user);
                    $user->forceFill([
                        'google_id' => $googleId,
                        'email_verified_at' => now(),
                        'avatar_url' => $user->avatar_url ?: $avatarUrl,
                    ])->save();
                } else {
                    $user->forceFill([
                        'google_id' => $googleId,
                        'avatar_url' => $user->avatar_url ?: $avatarUrl,
                    ])->save();
                }

                $this->ensureWallet($user);

                return $user;
            }

            if ($this->deletedUserExists('email', $email)) {
                throw $this->deletedAccount();
            }

            $user = new User;
            $user->forceFill([
                'name' => $name,
                'email' => $email,
                'password' => null,
                'google_id' => $googleId,
                'email_verified_at' => now(),
                'avatar_url' => $avatarUrl,
            ])->save();

            $this->ensureWallet($user);

            return $user;
        });
    }

    /**
     * @return array{requires_2fa: true, two_factor_token: string}|array{user: User, access_token: string, expires_in: int, refresh_token: string}
     */
    public function login(string $credential, Request $request): array
    {
        $user = $this->findOrCreateUser($this->verifyIdToken($credential));

        if ($user->hasTwoFactorEnabled()) {
            $this->otpService->send(
                $user->email,
                OtpService::PURPOSE_LOGIN_2FA,
                (int) $user->getKey(),
            );

            return [
                'requires_2fa' => true,
                'two_factor_token' => $this->tokens->issueTwoFactorToken($user),
            ];
        }

        $issued = $this->tokens->issueTokens($user, $request);

        return [
            'user' => $user->load('creditWallet'),
            'access_token' => $issued['access_token'],
            'expires_in' => $issued['expires_in'],
            'refresh_token' => $issued['refresh_token_plain'],
        ];
    }

    private function deletedUserExists(string $column, string $value): bool
    {
        return User::withTrashed()
            ->where($column, $value)
            ->whereNotNull('deleted_at')
            ->exists();
    }

    private function ensureWallet(User $user): void
    {
        $user->creditWallet()->firstOrCreate([], [
            'balance_available' => 0,
            'balance_held' => 0,
        ]);
    }

    private function avatarUrl(mixed $picture): ?string
    {
        if (! is_string($picture) || filter_var($picture, FILTER_VALIDATE_URL) === false) {
            return null;
        }

        return mb_substr($picture, 0, 1000);
    }

    private function name(mixed $name, string $email): string
    {
        $name = is_string($name) && trim($name) !== ''
            ? trim($name)
            : (string) strstr($email, '@', true);

        return mb_substr($name, 0, 255);
    }

    private function invalidCredential(): AuthException
    {
        return new AuthException(
            AuthErrorCode::INVALID_CREDENTIALS,
            'Thông tin đăng nhập Google không hợp lệ.',
            401,
        );
    }

    private function deletedAccount(): AuthException
    {
        return new AuthException(
            AuthErrorCode::ACCOUNT_DELETED,
            'Tài khoản đã bị xóa. Vui lòng liên hệ bộ phận hỗ trợ để được xem xét khôi phục.',
            403,
        );
    }
}
