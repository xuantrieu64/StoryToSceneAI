<?php

use App\Http\Middleware\AuthenticateTwoFactorJwt;
use App\Http\Middleware\JwtAuthenticate;
use App\Services\Auth\AuthErrorCode;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->trustProxies(at: '*');
        $middleware->alias([
            'jwt' => JwtAuthenticate::class,
            'jwt.auth' => JwtAuthenticate::class,
            'jwt.two_factor' => AuthenticateTwoFactorJwt::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        $exceptions->render(function (ThrottleRequestsException $exception, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'code' => AuthErrorCode::TOO_MANY_REQUESTS,
                    'message' => 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
                ], 429);
            }
        });

        $exceptions->render(function (ValidationException $exception, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'code' => AuthErrorCode::VALIDATION_ERROR,
                    'message' => 'Dữ liệu gửi lên không hợp lệ.',
                ], 422);
            }
        });
    })->create();
