<?php

namespace App\Services\Auth;

use App\Mail\SecurityAlertMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use RuntimeException;

class TwoFactorService
{
    public function __construct(
        private readonly OtpService $otpService,
        private readonly TokenService $tokens,
    ) {}

    /**
     * @return array{user: User, access_token: string, expires_in: int, refresh_token: string}
     */
    public function verifyLogin(
        string $twoFactorToken,
        ?string $otp,
        ?string $recoveryCode,
        Request $request,
    ): array {
        $user = $this->tokens->parseTwoFactorToken($twoFactorToken);

        if (! $user->hasTwoFactorEnabled()) {
            throw $this->invalidTwoFactorToken();
        }

        $isValid = false;
        if ($otp !== null) {
            $isValid = $this->otpService->verify($user->email, OtpService::PURPOSE_LOGIN_2FA, $otp);
        } elseif ($recoveryCode !== null) {
            $isValid = $this->consumeRecoveryCode($user, $recoveryCode);
            if ($isValid) {
                Mail::to($user->email)->queue(
                    (new SecurityAlertMail(SecurityAlertMail::RECOVERY_CODE_USED))->afterCommit(),
                );
            }
        }

        if (! $isValid) {
            if ($this->tokens->incrementTwoFactorFailure($twoFactorToken) > 5) {
                throw $this->invalidTwoFactorToken();
            }

            throw new AuthException(
                AuthErrorCode::OTP_INVALID,
                'Mã xác minh không hợp lệ hoặc đã hết hạn.',
                422,
            );
        }

        $this->tokens->consumeTwoFactorToken($twoFactorToken);
        $issued = $this->tokens->issueTokens($user, $request);

        return [
            'user' => $user->load('creditWallet'),
            'access_token' => $issued['access_token'],
            'expires_in' => $issued['expires_in'],
            'refresh_token' => $issued['refresh_token_plain'],
        ];
    }

    public function resendLoginOtp(string $twoFactorToken): void
    {
        $user = $this->tokens->parseTwoFactorToken($twoFactorToken);
        if (! $user->hasTwoFactorEnabled()) {
            throw $this->invalidTwoFactorToken();
        }

        $this->otpService->send($user->email, OtpService::PURPOSE_LOGIN_2FA, (int) $user->getKey());
    }

    public function requestEnable(User $user, ?string $password): void
    {
        if ($user->hasTwoFactorEnabled()) {
            throw new AuthException(
                AuthErrorCode::TWO_FACTOR_ALREADY_ENABLED,
                'Xác thực hai lớp đã được bật.',
                409,
            );
        }

        $this->confirmRecentAuthentication($user, $password);
        $this->otpService->send($user->email, OtpService::PURPOSE_ENABLE_2FA, (int) $user->getKey());
    }

    /**
     * @return list<string>
     */
    public function confirmEnable(User $user, string $otp): array
    {
        if (! $this->otpService->verify($user->email, OtpService::PURPOSE_ENABLE_2FA, $otp)) {
            throw $this->invalidOtp();
        }

        return DB::transaction(function () use ($user): array {
            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->getKey());
            if ($lockedUser->hasTwoFactorEnabled()) {
                throw new AuthException(
                    AuthErrorCode::TWO_FACTOR_ALREADY_ENABLED,
                    'Xác thực hai lớp đã được bật.',
                    409,
                );
            }

            [$plainCodes, $hashedCodes] = $this->makeRecoveryCodes();
            $lockedUser->forceFill([
                'two_factor_enabled_at' => now(),
                'two_factor_recovery_codes' => $hashedCodes,
            ])->save();

            return $plainCodes;
        });
    }

    public function requestDisable(User $user, ?string $password): void
    {
        if (! $user->hasTwoFactorEnabled()) {
            throw new AuthException(
                AuthErrorCode::TWO_FACTOR_NOT_ENABLED,
                'Xác thực hai lớp chưa được bật.',
                409,
            );
        }

        $this->confirmRecentAuthentication($user, $password);
        $this->otpService->send($user->email, OtpService::PURPOSE_DISABLE_2FA, (int) $user->getKey());
    }

    /**
     * @return array{user: User, access_token: string, expires_in: int, refresh_token: string}
     */
    public function confirmDisable(
        User $user,
        string $otp,
        string $currentRefreshToken,
        Request $request,
    ): array {
        $otpVerified = false;
        $issued = DB::transaction(function () use (
            $user,
            $otp,
            $currentRefreshToken,
            $request,
            &$otpVerified,
        ): ?array {
            $this->tokens->assertRefreshTokenUsableForUser(
                $currentRefreshToken,
                (int) $user->getKey(),
            );

            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->getKey());
            if (! $lockedUser->hasTwoFactorEnabled()) {
                throw new AuthException(
                    AuthErrorCode::TWO_FACTOR_NOT_ENABLED,
                    'Xác thực hai lớp chưa được bật.',
                    409,
                );
            }

            $otpVerified = $this->otpService->verify(
                $lockedUser->email,
                OtpService::PURPOSE_DISABLE_2FA,
                $otp,
            );
            if (! $otpVerified) {
                return null;
            }

            $lockedUser->forceFill([
                'two_factor_enabled_at' => null,
                'two_factor_recovery_codes' => null,
                'sessions_valid_after' => now(),
            ])->save();

            return $this->tokens->refresh(
                $currentRefreshToken,
                $request,
                (int) $lockedUser->getKey(),
                true,
            );
        });

        if (! $otpVerified) {
            throw $this->invalidOtp();
        }

        if (! is_array($issued)) {
            throw new RuntimeException('Không thể cấp lại token cho phiên hiện tại.');
        }

        Mail::to($user->email)->queue(
            (new SecurityAlertMail(SecurityAlertMail::TWO_FACTOR_DISABLED))->afterCommit(),
        );

        return [
            'user' => $issued['user']->load('creditWallet'),
            'access_token' => $issued['access_token'],
            'expires_in' => $issued['expires_in'],
            'refresh_token' => $issued['refresh_token_plain'],
        ];
    }

    public function requestRecoveryCodeRegeneration(User $user, ?string $password): void
    {
        if (! $user->hasTwoFactorEnabled()) {
            throw new AuthException(
                AuthErrorCode::TWO_FACTOR_NOT_ENABLED,
                'Xác thực hai lớp chưa được bật.',
                409,
            );
        }

        $this->confirmRecentAuthentication($user, $password);
        $this->otpService->send(
            $user->email,
            OtpService::PURPOSE_REGENERATE_CODES,
            (int) $user->getKey(),
        );
    }

    /**
     * @return list<string>
     */
    public function regenerateRecoveryCodes(User $user, ?string $password, string $otp): array
    {
        if (! $user->hasTwoFactorEnabled()) {
            throw new AuthException(
                AuthErrorCode::TWO_FACTOR_NOT_ENABLED,
                'Xác thực hai lớp chưa được bật.',
                409,
            );
        }

        $this->confirmRecentAuthentication($user, $password);
        if (! $this->otpService->verify($user->email, OtpService::PURPOSE_REGENERATE_CODES, $otp)) {
            throw $this->invalidOtp();
        }

        return DB::transaction(function () use ($user): array {
            $lockedUser = User::query()->lockForUpdate()->findOrFail($user->getKey());
            if (! $lockedUser->hasTwoFactorEnabled()) {
                throw new AuthException(
                    AuthErrorCode::TWO_FACTOR_NOT_ENABLED,
                    'Xác thực hai lớp chưa được bật.',
                    409,
                );
            }

            [$plainCodes, $hashedCodes] = $this->makeRecoveryCodes();
            $lockedUser->forceFill(['two_factor_recovery_codes' => $hashedCodes])->save();

            return $plainCodes;
        });
    }

    private function confirmRecentAuthentication(User $user, ?string $password): void
    {
        if (is_string($user->password) && $user->password !== '') {
            if (! is_string($password) || ! Hash::check($password, $user->password)) {
                throw new AuthException(
                    AuthErrorCode::INVALID_CREDENTIALS,
                    'Mật khẩu không chính xác.',
                    401,
                );
            }

            return;
        }

        if ($user->last_login_at === null || $user->last_login_at->lt(now()->subMinutes(10))) {
            throw new AuthException(
                AuthErrorCode::RECENT_AUTHENTICATION_REQUIRED,
                'Vui lòng đăng nhập lại trước khi thay đổi cài đặt bảo mật.',
                403,
            );
        }
    }

    private function consumeRecoveryCode(User $user, string $recoveryCode): bool
    {
        return DB::transaction(function () use ($user, $recoveryCode): bool {
            $lockedUser = User::query()->lockForUpdate()->find($user->getKey());
            if ($lockedUser === null || ! $lockedUser->hasTwoFactorEnabled()) {
                return false;
            }

            $hashedCodes = $lockedUser->two_factor_recovery_codes ?? [];
            foreach ($hashedCodes as $index => $hashedCode) {
                if (is_string($hashedCode) && Hash::check($recoveryCode, $hashedCode)) {
                    unset($hashedCodes[$index]);
                    $lockedUser->forceFill([
                        'two_factor_recovery_codes' => array_values($hashedCodes),
                    ])->save();

                    return true;
                }
            }

            return false;
        });
    }

    /**
     * @return array{list<string>, list<string>}
     */
    private function makeRecoveryCodes(): array
    {
        $plainCodes = [];
        $hashedCodes = [];

        for ($index = 0; $index < 8; $index++) {
            $code = Str::lower(Str::random(4)).'-'.Str::lower(Str::random(4));
            $plainCodes[] = $code;
            $hashedCodes[] = Hash::make($code);
        }

        return [$plainCodes, $hashedCodes];
    }

    private function invalidOtp(): AuthException
    {
        return new AuthException(
            AuthErrorCode::OTP_INVALID,
            'Mã xác minh không hợp lệ hoặc đã hết hạn.',
            422,
        );
    }

    private function invalidTwoFactorToken(): AuthException
    {
        return new AuthException(
            AuthErrorCode::TOKEN_INVALID,
            'Token xác minh hai lớp không hợp lệ.',
            401,
        );
    }
}
