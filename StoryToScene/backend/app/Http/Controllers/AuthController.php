<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\VerifyTwoFactorRequest;
use App\Http\Resources\UserResource;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(protected UserService $userService) {}
    

    public function register(RegisterRequest $request): JsonResponse 
    {
        $result = $this->userService->register($request->validated());

        return response()->json([
            'status' => 'success',
            'message' => 'Đăng ký tài khoản thành công.',
            'data' => [
                'user' => new UserResource($result['user']),
                'access_token' => $result['token'],
                'token_type' => 'Bearer',
            ],
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->userService->login($request->validated(), $request->ip());

        if ($result['two_factor_required']) {
            return response()->json([
                'status' => 'two_factor_required',
                'message' => $result['message'],
            ], 202);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Đăng nhập thành công.',
            'data' => [
                'user' => new UserResource($result['user']),
                'access_token' => $result['token'],
                'token_type' => 'Bearer',
            ],
        ], 200);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('creditWallet');

        return response()->json([
            'status' => 'success',
            'data' => new UserResource($user),
        ], 200);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->userService->logout($request->user());

        return response()->json([
            'status' => 'success',
            'message' => 'Đăng xuất thành công.',
        ], 200);
    }

    public function enableTwoFactor(Request $request): JsonResponse
    {
        $data = $this->userService->enableTwoFactor($request->user());

        return response()->json([
            'status' => 'success',
            'message' => 'Khởi tạo 2FA thành công. Vui lòng quét mã QR và xác nhận mã OTP.',
            'data' => $data,
        ], 200);
    }

    public function verifyTwoFactor(VerifyTwoFactorRequest $request): JsonResponse
    {
        $this->userService->verifyTwoFactor($request->user(), $request->validated('code'));

        return response()->json([
            'status' => 'success',
            'message' => 'Xác minh và bật 2FA thành công.',
        ], 200);
    }

    public function disableTwoFactor(Request $request): JsonResponse
    {
        $this->userService->disableTwoFactor($request->user());

        return response()->json([
            'status' => 'success',
            'message' => 'Đã tắt tính năng bảo mật 2FA.',
        ], 200);
    }

}
