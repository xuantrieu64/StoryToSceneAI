<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ConfirmOtpRequest;
use App\Http\Requests\Auth\GoogleLoginRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\PasswordConfirmRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResendOtpRequest;
use App\Http\Requests\Auth\ResendTwoFactorRequest;
use App\Http\Requests\Auth\VerifyEmailRequest;
use App\Http\Requests\Auth\VerifyTwoFactorRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\Auth\AuthErrorCode;
use App\Services\Auth\AuthException;
use App\Services\Auth\AuthService;
use App\Services\Auth\GoogleAuthService;
use App\Services\Auth\TokenService;
use App\Services\Auth\TwoFactorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(
        private readonly AuthService $auth,
        private readonly GoogleAuthService $googleAuth,
        private readonly TokenService $tokens,
        private readonly TwoFactorService $twoFactor,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $this->auth->register($request->validated());

        return response()->json([
            'message' => 'Mã xác minh đã được gửi đến email của bạn.',
            'email' => $request->validated('email'),
        ], 202);
    }

    public function verifyEmail(VerifyEmailRequest $request): JsonResponse
    {
        return $this->tokenResponse($this->auth->verifyEmail(
            $request->validated('email'),
            $request->validated('otp'),
            $request,
        ));
    }

    public function resendOtp(ResendOtpRequest $request): JsonResponse
    {
        $this->auth->resendOtp(
            $request->validated('email'),
        );

        return response()->json([
            'message' => 'Nếu tài khoản đang chờ xác minh, mã mới sẽ được gửi đến email.',
        ], 202);
    }

    public function verifyTwoFactor(VerifyTwoFactorRequest $request): JsonResponse
    {
        return $this->tokenResponse($this->twoFactor->verifyLogin(
            $request->validated('two_factor_token'),
            $request->validated('otp'),
            $request->validated('recovery_code'),
            $request,
        ));
    }

    public function resendTwoFactor(ResendTwoFactorRequest $request): JsonResponse
    {
        $this->twoFactor->resendLoginOtp($request->validated('two_factor_token'));

        return response()->json(['message' => 'Mã xác minh đã được gửi lại.'], 202);
    }

    public function requestEnableTwoFactor(PasswordConfirmRequest $request): JsonResponse
    {
        $this->twoFactor->requestEnable($this->authenticatedUser($request), $this->password($request));

        return response()->json(['message' => 'Mã xác minh đã được gửi đến email của bạn.'], 202);
    }

    public function confirmEnableTwoFactor(ConfirmOtpRequest $request): JsonResponse
    {
        $codes = $this->twoFactor->confirmEnable(
            $this->authenticatedUser($request),
            $request->validated('otp'),
        );

        return response()->json([
            'message' => 'Đã bật xác thực hai lớp. Hãy lưu các mã khôi phục ở nơi an toàn.',
            'recovery_codes' => $codes,
        ]);
    }

    public function requestDisableTwoFactor(PasswordConfirmRequest $request): JsonResponse
    {
        $this->twoFactor->requestDisable($this->authenticatedUser($request), $this->password($request));

        return response()->json(['message' => 'Mã xác minh đã được gửi đến email của bạn.'], 202);
    }

    public function confirmDisableTwoFactor(ConfirmOtpRequest $request): JsonResponse
    {
        $refreshToken = $request->cookie('refresh_token');
        if (! is_string($refreshToken) || $refreshToken === '') {
            throw new AuthException(AuthErrorCode::TOKEN_INVALID, 'Refresh token không hợp lệ.', 401);
        }

        $tokens = $this->twoFactor->confirmDisable(
            $this->authenticatedUser($request),
            $request->validated('otp'),
            $refreshToken,
            $request,
        );

        return $this->tokenResponse($tokens);
    }

    public function regenerateRecoveryCodes(PasswordConfirmRequest $request): JsonResponse
    {
        $user = $this->authenticatedUser($request);
        $password = $this->password($request);
        $otp = $request->validated('otp');

        if (! is_string($otp)) {
            $this->twoFactor->requestRecoveryCodeRegeneration($user, $password);

            return response()->json(['message' => 'Mã xác minh đã được gửi đến email của bạn.'], 202);
        }

        return response()->json([
            'message' => 'Mã khôi phục mới đã được tạo. Hãy lưu chúng ở nơi an toàn.',
            'recovery_codes' => $this->twoFactor->regenerateRecoveryCodes($user, $password, $otp),
        ]);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->auth->login(
            $request->validated('email'),
            $request->validated('password'),
            $request,
        );

        if ($result['requires_2fa'] ?? false) {
            return response()->json([
                'requires_2fa' => true,
                'two_factor_token' => $result['two_factor_token'],
            ], 202);
        }

        return $this->tokenResponse($result);
    }

    public function googleLogin(GoogleLoginRequest $request): JsonResponse
    {
        $result = $this->googleAuth->login($request->validated('credential'), $request);

        if ($result['requires_2fa'] ?? false) {
            return response()->json([
                'requires_2fa' => true,
                'two_factor_token' => $result['two_factor_token'],
            ], 202);
        }

        return $this->tokenResponse($result);
    }

    public function refresh(Request $request): JsonResponse
    {
        return $this->tokenResponse($this->auth->refresh($request));
    }

    public function logout(Request $request): JsonResponse
    {
        $this->auth->logout($request);

        return response()->json([
            'message' => 'Đăng xuất thành công.',
        ])->withCookie($this->tokens->forgetRefreshCookie());
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user instanceof User) {
            throw new AuthException(AuthErrorCode::TOKEN_INVALID, 'Access token không hợp lệ.', 401);
        }

        return response()->json(['user' => new UserResource($user->load('creditWallet'))]);
    }

    /**
     * @param  array{user: User, access_token: string, expires_in: int, refresh_token: string}  $tokens
     */
    private function tokenResponse(array $tokens): JsonResponse
    {
        return response()->json([
            'access_token' => $tokens['access_token'],
            'expires_in' => $tokens['expires_in'],
            'user' => new UserResource($tokens['user']->load('creditWallet')),
        ])->withCookie($this->tokens->makeRefreshCookie($tokens['refresh_token']));
    }

    private function authenticatedUser(Request $request): User
    {
        $user = $request->user();
        if (! $user instanceof User) {
            throw new AuthException(AuthErrorCode::TOKEN_INVALID, 'Access token không hợp lệ.', 401);
        }

        return $user;
    }

    private function password(PasswordConfirmRequest $request): ?string
    {
        $password = $request->validated('password');

        return is_string($password) ? $password : null;
    }
}
