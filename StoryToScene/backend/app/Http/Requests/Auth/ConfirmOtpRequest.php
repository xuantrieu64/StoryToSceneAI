<?php

namespace App\Http\Requests\Auth;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ConfirmOtpRequest extends FormRequest
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
        return ['otp' => ['required', 'string', 'digits:6']];
    }

    public function messages(): array
    {
        return [
            'otp.required' => 'Vui lòng nhập mã xác minh.',
            'otp.digits' => 'Mã xác minh phải gồm 6 chữ số.',
        ];
    }
}
