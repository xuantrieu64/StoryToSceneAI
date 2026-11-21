<?php

namespace App\Http\Middleware;

use App\Services\Auth\AuthErrorCode;
use App\Services\Auth\AuthException;
use App\Services\Auth\TokenService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateTwoFactorJwt
{
    public function __construct(private readonly TokenService $tokens) {}

    public function handle(Request $request, \Closure $next): Response
    {
        $token = $request->bearerToken();

        if ($token === null || $token === '') {
            throw $this->invalidToken();
        }

        $user = $this->tokens->parseTwoFactorToken($token);

        $request->setUserResolver(static fn () => $user);
        $request->attributes->set('auth.jwt_claims', ['scope' => '2fa']);

        try {
            $response = $next($request);
        } catch (AuthException $exception) {
            if ($exception->errorCode === AuthErrorCode::OTP_INVALID) {
                $this->tokens->incrementTwoFactorFailure($token);
            }

            throw $exception;
        }

        $this->tokens->consumeTwoFactorToken($token);

        return $response;
    }

    private function invalidToken(): AuthException
    {
        return new AuthException(
            AuthErrorCode::TOKEN_INVALID,
            'Token xác minh hai lớp không hợp lệ.',
            401,
        );
    }
}
