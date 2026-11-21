<?php

namespace App\Http\Requests\Auth;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class GoogleLoginRequest extends FormRequest
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
        return ['credential' => ['required', 'string', 'max:8192']];
    }

    public function messages(): array
    {
        return ['credential.required' => 'Thiếu thông tin xác thực Google.'];
    }
}
