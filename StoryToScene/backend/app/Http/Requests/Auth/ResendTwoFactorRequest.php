<?php

namespace App\Http\Requests\Auth;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ResendTwoFactorRequest extends FormRequest
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
        return ['two_factor_token' => ['required', 'string', 'max:4096']];
    }

    public function messages(): array
    {
        return ['two_factor_token.required' => 'Thiếu token xác minh hai lớp.'];
    }
}
