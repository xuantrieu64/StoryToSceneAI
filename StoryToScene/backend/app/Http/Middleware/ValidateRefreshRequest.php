<?php

namespace App\Http\Middleware;

use App\Services\Auth\AuthErrorCode;
use App\Services\Auth\AuthException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateRefreshRequest
{
    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->headers->get('Origin');
        $allowedOrigins = config('cors.allowed_origins', []);

        if (! is_string($origin) || ! in_array($origin, $allowedOrigins, true)) {
            throw new AuthException(
                AuthErrorCode::ORIGIN_NOT_ALLOWED,
                'Nguồn gửi yêu cầu không được phép.',
                403,
            );
        }

        $requestedWith = $request->headers->get('X-Requested-With');
        if (! is_string($requestedWith) || strcasecmp($requestedWith, 'XMLHttpRequest') !== 0) {
            throw new AuthException(
                AuthErrorCode::CSRF_HEADER_REQUIRED,
                'Yêu cầu thiếu header bảo vệ.',
                403,
            );
        }

        return $next($request);
    }
}
