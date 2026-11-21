<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class AuthService
{
    public function __construct(
        private readonly OtpService $otpService,
        private readonly TokenService $tokens,
    ) {}

    /**
     * @param  array{name: string, email: string, password: string}  $data
     */
    public function register(array $data): void
    {
        $email = mb_strtolower(trim($data['email']));

        $user = DB::transaction(function () use ($data, $email): User {
            $verifiedUser = User::query()
                ->where('email', $email)
                ->whereNotNull('email_verified_at')
                ->lockForUpdate()
                ->first();

            if ($verifiedUser !== null) {
                throw new AuthException(
                    AuthErrorCode::EMAIL_ALREADY_REGISTERED,
                    'Không thể đăng ký bằng email này.',
                    422,
                );
            }

            $user = User::query()
                ->where('email', $email)
                ->whereNull('email_verified_at')
                ->lockForUpdate()
                ->first();

            if ($user === null) {
                $user = new User;
                $user->forceFill([
                    'name' => $data['name'],
                    'email' => $email,
                    'password' => $data['password'],
                    'email_verified_at' => null,
                ])->save();
            } else {
                $user->forceFill([
                    'name' => $data['name'],
                    'password' => $data['password'],
                    'email_verified_at' => null,
                ])->save();
            }

            return $user;
        });

        $this->otpService->send($user->email, OtpService::PURPOSE_REGISTER, (int) $user->getKey());
    }

    public function resendOtp(string $email): void
    {
        $user = User::query()
            ->where('email', mb_strtolower(trim($email)))
            ->whereNull('email_verified_at')
            ->first();

        if ($user !== null) {
            $this->otpService->send($user->email, OtpService::PURPOSE_REGISTER, (int) $user->getKey());
        }
    }

    /**
     * @return array{user: User, access_token: string, expires_in: int, refresh_token: string}
     */
    public function verifyEmail(string $email, string $otp, Request $request): array
    {
        $email = mb_strtolower(trim($email));

        if (! $this->otpService->verify($email, OtpService::PURPOSE_REGISTER, $otp)) {
            throw new AuthException(AuthErrorCode::OTP_INVALID, 'Mã xác minh không hợp lệ hoặc đã hết hạn.', 422);
        }

        return DB::transaction(function () use ($email, $request): array {
            $user = User::query()->where('email', $email)->lockForUpdate()->first();

            if ($user === null) {
                throw new AuthException(
                    AuthErrorCode::OTP_INVALID,
                    'Mã xác minh không hợp lệ hoặc đã hết hạn.',
                    422,
                );
            }

            if ($user->email_verified_at === null) {
                $user->forceFill(['email_verified_at' => now()])->save();
            }

            $user->creditWallet()->firstOrCreate([], [
                'balance_available' => 0,
                'balance_held' => 0,
            ]);

            return $this->createSession($user, $request);
        });
    }

    /**
     * @return array{requires_2fa: true, two_factor_token: string}|array{user: User, access_token: string, expires_in: int, refresh_token: string}
     */
    public function login(string $email, string $password, Request $request): array
    {
        $email = mb_strtolower(trim($email));
        $loginKey = 'auth-login-fail:'.hash('sha256', $email.'|'.(string) $request->ip());

        if (RateLimiter::tooManyAttempts($loginKey, 5)) {
            throw new AuthException(
                AuthErrorCode::TOO_MANY_REQUESTS,
                'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
                429,
            );
        }

        $user = User::query()->where('email', $email)->first();

        if ($user === null || $user->password === null || ! Hash::check($password, $user->password)) {
            RateLimiter::hit($loginKey, 60);
            throw new AuthException(AuthErrorCode::INVALID_CREDENTIALS, 'Email hoặc mật khẩu không chính xác.', 401);
        }

        RateLimiter::clear($loginKey);

        if ($user->email_verified_at === null) {
            throw new AuthException(AuthErrorCode::EMAIL_UNVERIFIED, 'Vui lòng xác minh email trước khi đăng nhập.', 403);
        }

        if ($user->hasTwoFactorEnabled()) {
            $this->otpService->send($user->email, OtpService::PURPOSE_LOGIN_2FA, (int) $user->getKey());

            return [
                'requires_2fa' => true,
                'two_factor_token' => $this->tokens->issueTwoFactorToken($user),
            ];
        }

        return $this->createSession($user, $request);
    }

    public function logout(Request $request): void
    {
        $claims = $request->attributes->get('auth.jwt_claims');
        if (is_array($claims) && isset($claims['jti'], $claims['exp'])) {
            $this->tokens->revokeAccessToken((string) $claims['jti'], (int) $claims['exp']);
        }

        $refreshToken = $request->cookie('refresh_token');
        if (is_string($refreshToken) && $refreshToken !== '') {
            $this->tokens->revoke($refreshToken);
        }
    }

    /**
     * @return array{user: User, access_token: string, expires_in: int, refresh_token: string}
     */
    public function refresh(Request $request): array
    {
        $refreshToken = $request->cookie('refresh_token');
        if (! is_string($refreshToken) || $refreshToken === '') {
            throw new AuthException(AuthErrorCode::TOKEN_INVALID, 'Refresh token không hợp lệ.', 401);
        }

        $issued = $this->tokens->refresh($refreshToken, $request);

        return [
            'user' => $issued['user'],
            'access_token' => $issued['access_token'],
            'expires_in' => $issued['expires_in'],
            'refresh_token' => $issued['refresh_token_plain'],
        ];
    }

    /**
     * @return array{user: User, access_token: string, expires_in: int, refresh_token: string}
     */
    private function createSession(User $user, Request $request): array
    {
        $issued = $this->tokens->issueTokens($user, $request);

        return [
            'user' => $user->load('creditWallet'),
            'access_token' => $issued['access_token'],
            'expires_in' => $issued['expires_in'],
            'refresh_token' => $issued['refresh_token_plain'],
        ];
    }
}
