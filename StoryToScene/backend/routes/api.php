<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Middleware\ValidateRefreshRequest;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth-register');
        Route::post('/verify-email', [AuthController::class, 'verifyEmail'])->middleware('throttle:auth-verify-email');
        Route::post('/resend-otp', [AuthController::class, 'resendOtp'])->middleware('throttle:auth-resend-otp');
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth-login');
        Route::post('/google', [AuthController::class, 'googleLogin'])->middleware('throttle:auth-google');
        Route::post('/2fa/verify', [AuthController::class, 'verifyTwoFactor'])
            ->middleware('throttle:auth-two-factor-verify');
        Route::post('/2fa/resend', [AuthController::class, 'resendTwoFactor'])
            ->middleware('throttle:auth-two-factor-resend');
        Route::post('/2fa/enable/request', [AuthController::class, 'requestEnableTwoFactor'])
            ->middleware(['jwt', 'throttle:auth-two-factor-enable']);
        Route::post('/2fa/enable/confirm', [AuthController::class, 'confirmEnableTwoFactor'])
            ->middleware(['jwt', 'throttle:auth-two-factor-enable']);
        Route::post('/2fa/disable/request', [AuthController::class, 'requestDisableTwoFactor'])
            ->middleware(['jwt', 'throttle:auth-two-factor-disable']);
        Route::post('/2fa/disable/confirm', [AuthController::class, 'confirmDisableTwoFactor'])
            ->middleware(['jwt', 'throttle:auth-two-factor-disable']);
        Route::post('/2fa/recovery-codes/regenerate', [AuthController::class, 'regenerateRecoveryCodes'])
            ->middleware(['jwt', 'throttle:auth-two-factor-recovery-codes']);
        Route::post('/refresh', [AuthController::class, 'refresh'])
            ->middleware(['throttle:auth-refresh', ValidateRefreshRequest::class]);
        Route::post('/logout', [AuthController::class, 'logout'])
            ->middleware(['jwt', 'throttle:auth-logout']);
    });

    Route::get('/me', [AuthController::class, 'me'])->middleware(['jwt', 'throttle:auth-me']);
});

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'db' => DB::connection()->getPdo() ? 'connected' : 'failed',
        'redis' => Cache::store('redis')->put('health', 1, 10) ? 'connected' : 'failed',
    ]);
});
