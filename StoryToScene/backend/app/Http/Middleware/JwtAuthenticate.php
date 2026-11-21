<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\Auth\AuthErrorCode;
use App\Services\Auth\AuthException;
use App\Services\Auth\TokenService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class JwtAuthenticate
{
    public function __construct(private readonly TokenService $tokens) {}

    public function handle(Request $request, Closure $next): Response
    {
        $jwt = $request->bearerToken();

        if ($jwt === null || $jwt === '') {
            throw $this->invalidToken();
        }

        $claims = $this->tokens->parseAccessToken($jwt);

        if ($this->tokens->isAccessTokenRevoked($claims->jti)) {
            throw $this->invalidToken();
        }

        $user = User::query()->find($claims->sub);
        if ($user === null) {
            throw $this->invalidToken();
        }

        $cutoff = Cache::remember(
            TokenService::sessionsValidAfterCacheKey($user->getKey()),
            (int) config('auth_tokens.access_ttl_minutes', 10) * 60,
            static fn (): int => $user->sessions_valid_after?->getTimestamp() ?? 0,
        );

        if ($claims->iat < (int) $cutoff) {
            throw $this->invalidToken();
        }

        Auth::setUser($user);
        $request->setUserResolver(static fn () => $user);
        $request->attributes->set('auth.jwt_claims', get_object_vars($claims));

        return $next($request);
    }

    private function invalidToken(): AuthException
    {
        return new AuthException(
            AuthErrorCode::TOKEN_INVALID,
            'Access token không hợp lệ.',
            401,
        );
    }
}
