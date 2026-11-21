<?php

namespace App\Http\Requests\Auth;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class PasswordConfirmRequest extends FormRequest
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
            'password' => ['nullable', 'string', 'max:255'],
            'otp' => ['sometimes', 'nullable', 'string', 'digits:6'],
        ];
    }

    public function messages(): array
    {
        return [
            'password.string' => 'Mật khẩu không hợp lệ.',
            'otp.digits' => 'Mã xác minh phải gồm 6 chữ số.',
        ];
    }
}
