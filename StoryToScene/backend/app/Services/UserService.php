<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use PragmaRX\Google2FALaravel\Facade as Google2FA;

class UserService
{
    // Đăng ký người dùng mới và tự động tạo Ví Credit rỗng trong 1 Transaction
    public function register(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => 'user',
            ]);

            $user->creditWallet()->create([
                'balance_available' => 0,
                'balance_held' => 0,
            ]);

            $user->load('creditWallet');
            $token = $user->createToken('auth_token')->plainTextToken;

            return [
                'user' => $user,
                'token' => $token,
            ];
        });
    }

    // Xác thực đăng nhập và kiểm tra 2FA và token
    public function login(array $credentials, ?string $ipAddress = null): array
    {
        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email không hợp lệ'],
            ]);
        }

        // Kiểm tra bảo mật 2FA nếu đã được kích hoạt
        if ($user->hasTwoFactorEnabled()) {
            $code = $credentials['two_factor_code'] ?? null;
            if (! $code) {
                return [
                    'two_factor_required' => true,
                    'message' => 'Tài khoản đã bật 2FA. Vui lòng cung cấp mã xác minh',
                ];
            }

            $valid = Google2FA::verifyKey($user->two_factor_secret, $code);
            if (! $valid) {
                throw ValidationException::withMessages([
                    'two_factor_code' => ['Mã 2FA không chính xác hoặc đã hết hạn.'],
                ]);
            }

        }

        // Cập nhật thông tin đăng nhập cuối
        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $ipAddress,
        ]);

        $user->load('creditWallet');
        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'two_factor_required' => false,
            'user' => $user,
            'token' => $token,
        ];
    }

    // Thu hồi Token đăng xuất.
    public function logout(User $user): void
    {
        $accessToken = $user->currentAccessToken();

        if ($accessToken !== null && method_exists($accessToken, 'delete')) {
            $accessToken->delete();
        }
    }

    // Bật 2FA: Sinh mã Secret Key và URL QR Code.
    public function enableTwoFactor(User $user): array
    {
        $secret = Google2FA::generateSecretKey();

        $user->update([
            'two_factor_secret' => $secret,
            'two_factor_confirmed_at' => null, // Chưa xác nhận
        ]);

        $qrCodeUrl = Google2FA::getQRCodeUrl(
            config('app.name', 'StoryToSceneAI'),
            $user->email,
            $secret
        );

        return [
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
        ];
    }

    // Xác minh OTP để kích hoạt 2FA hoàn tất
    public function verifyTwoFactor(User $user, string $code): bool
    {
        if (! $user->two_factor_secret) {
            throw ValidationException::withMessages([
                'code' => ['Bạn chưa khởi tạo thiết lập 2FA.'],
            ]);
        }

        $valid = Google2FA::verifyKey($user->two_factor_secret, $code);

        if (! $valid) {
            throw ValidationException::withMessages([
                'code' => ['Mã OTP 2FA không hợp lệ.'],
            ]);
        }

        $user->update([
            'two_factor_confirmed_at' => now(),
        ]);

        return true;
    }

    // Tắt 2FA.
    public function disableTwoFactor(User $user): void
    {
        $user->update([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ]);
    }
}
