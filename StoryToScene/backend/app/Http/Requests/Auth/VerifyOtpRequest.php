<?php

namespace App\Http\Requests\Auth;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class VerifyOtpRequest extends FormRequest
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
        return ['code' => ['required', 'string', 'digits:6']];
    }

    public function messages(): array
    {
        return [
            'code.required' => 'Vui lòng nhập mã xác minh.',
            'code.digits' => 'Mã xác minh phải gồm 6 chữ số.',
        ];
    }
}
