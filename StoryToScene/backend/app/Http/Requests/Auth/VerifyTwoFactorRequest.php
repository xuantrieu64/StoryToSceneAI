<?php

namespace App\Http\Requests\Auth;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class VerifyTwoFactorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'two_factor_token' => ['required', 'string', 'max:4096'],
            'otp' => [
                'nullable',
                'required_without:recovery_code',
                'digits:6',
                'prohibits:recovery_code',
            ],
            'recovery_code' => [
                'nullable',
                'required_without:otp',
                'string',
                'regex:/^[a-z0-9]{4}-[a-z0-9]{4}$/',
                'prohibits:otp',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'two_factor_token.required' => 'Thiếu token xác minh hai lớp.',
            'otp.required_without' => 'Vui lòng nhập mã OTP hoặc mã khôi phục.',
            'otp.digits' => 'Mã OTP phải gồm 6 chữ số.',
            'otp.prohibits' => 'Chỉ được cung cấp OTP hoặc mã khôi phục.',
            'recovery_code.required_without' => 'Vui lòng nhập mã OTP hoặc mã khôi phục.',
            'recovery_code.regex' => 'Mã khôi phục không đúng định dạng.',
            'recovery_code.prohibits' => 'Chỉ được cung cấp OTP hoặc mã khôi phục.',
        ];
    }
}
