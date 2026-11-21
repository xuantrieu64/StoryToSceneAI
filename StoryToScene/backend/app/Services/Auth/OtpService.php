<?php

namespace App\Services\Auth;

use App\Jobs\SendOtpMailJob;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\RateLimiter;
use InvalidArgumentException;

class OtpService
{
    public const PURPOSE_REGISTER = 'register';

    public const PURPOSE_LOGIN_2FA = 'login_2fa';

    public const PURPOSE_ENABLE_2FA = 'enable_2fa';

    public const PURPOSE_DISABLE_2FA = 'disable_2fa';

    public const PURPOSE_REGENERATE_CODES = 'regenerate_codes';

    private const PURPOSES = [
        self::PURPOSE_REGISTER,
        self::PURPOSE_LOGIN_2FA,
        self::PURPOSE_ENABLE_2FA,
        self::PURPOSE_DISABLE_2FA,
        self::PURPOSE_REGENERATE_CODES,
    ];

    public function send(string $email, string $purpose, ?int $userId = null): void
    {
        $this->assertPurpose($purpose);
        $email = $this->normalizeEmail($email);
        $sendKey = "otp-send:{$email}:{$purpose}";

        if (RateLimiter::tooManyAttempts($sendKey, 5)) {
            $this->throttled();
        }

        $otp = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiresAt = now()->addMinutes($purpose === self::PURPOSE_LOGIN_2FA ? 5 : 10);
        $now = now();

        DB::transaction(function () use ($email, $purpose, $userId, $otp, $expiresAt, $now): void {
            $lastSent = DB::table('email_otps')
                ->where('email', $email)
                ->where('purpose', $purpose)
                ->orderByDesc('id')
                ->lockForUpdate()
                ->value('last_sent_at');

            if ($lastSent !== null && Carbon::parse($lastSent)->gt($now->copy()->subSeconds(60))) {
                $this->throttled();
            }

            DB::table('email_otps')
                ->where('email', $email)
                ->where('purpose', $purpose)
                ->whereNull('consumed_at')
                ->delete();

            DB::table('email_otps')->insert([
                'user_id' => $userId,
                'email' => $email,
                'purpose' => $purpose,
                'otp_hash' => hash_hmac('sha256', $otp, (string) config('app.key')),
                'attempts' => 0,
                'expires_at' => $expiresAt,
                'last_sent_at' => $now,
                'consumed_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        });

        RateLimiter::hit($sendKey, 3600);

        SendOtpMailJob::dispatch($email, $otp, $purpose, $expiresAt->toIso8601String())
            ->afterCommit();
    }

    public function verify(string $email, string $purpose, string $otp): bool
    {
        $this->assertPurpose($purpose);
        $email = $this->normalizeEmail($email);
        $failureKey = "otp-fail:{$email}";

        if (RateLimiter::attempts($failureKey) > 10) {
            $this->throttled();
        }

        $throttled = false;
        $verified = DB::transaction(function () use ($email, $purpose, $otp, $failureKey, &$throttled): bool {
            $record = DB::table('email_otps')
                ->where('email', $email)
                ->where('purpose', $purpose)
                ->orderByDesc('id')
                ->lockForUpdate()
                ->first();

            if (
                $record === null
                || $record->consumed_at !== null
                || Carbon::parse($record->expires_at)->lte(now())
                || (int) $record->attempts >= 5
            ) {
                return false;
            }

            $expectedHash = hash_hmac('sha256', $otp, (string) config('app.key'));

            if (hash_equals((string) $record->otp_hash, $expectedHash)) {
                DB::table('email_otps')->where('id', $record->id)->update([
                    'consumed_at' => now(),
                    'updated_at' => now(),
                ]);

                return true;
            }

            DB::table('email_otps')->where('id', $record->id)->increment('attempts');
            RateLimiter::hit($failureKey, 1800);
            $throttled = RateLimiter::attempts($failureKey) > 10;

            return false;
        });

        if ($throttled) {
            $this->throttled();
        }

        return $verified;
    }

    private function assertPurpose(string $purpose): void
    {
        if (! in_array($purpose, self::PURPOSES, true)) {
            throw new InvalidArgumentException('Mục đích OTP không hợp lệ.');
        }
    }

    private function normalizeEmail(string $email): string
    {
        return mb_strtolower(trim($email));
    }

    private function throttled(): never
    {
        throw new AuthException(
            AuthErrorCode::OTP_THROTTLED,
            'Bạn đã thao tác quá nhanh. Vui lòng thử lại sau.',
            429,
        );
    }
}
