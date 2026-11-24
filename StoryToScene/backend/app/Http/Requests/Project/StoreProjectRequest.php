<?php

namespace App\Http\Requests\Project;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProjectRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:120'],
            'project_type' => ['required', Rule::in(['novel', 'script'])],
            'genre_note' => ['nullable', 'string'],
            'genre_id' => [
                'nullable',
                'integer',
                Rule::exists('genres', 'id')->where('is_active', true),
            ],
            'visual_style_id' => [
                'nullable',
                'integer',
                Rule::exists('visual_styles', 'id')->where('is_active', true),
            ],
            'aspect_ratio' => ['required', Rule::in(['16:9', '9:16'])],
            'ai_language' => ['required', Rule::in(['vi', 'en'])],
            'setting' => [
                'nullable',
                'array:era,location,people_description,costume_description,architecture_description,sign_language_text,life_details,negative_prompt',
            ],
            'setting.era' => ['nullable', 'string', 'max:255'],
            'setting.location' => ['nullable', 'string', 'max:255'],
            'setting.people_description' => ['nullable', 'string'],
            'setting.costume_description' => ['nullable', 'string'],
            'setting.architecture_description' => ['nullable', 'string'],
            'setting.sign_language_text' => ['nullable', 'string', 'max:255'],
            'setting.life_details' => ['nullable', 'string'],
            'setting.negative_prompt' => ['nullable', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Vui lòng nhập tên dự án.',
            'title.max' => 'Tên dự án không được vượt quá 120 ký tự.',
            'project_type.required' => 'Vui lòng chọn loại dự án.',
            'project_type.in' => 'Loại dự án không hợp lệ.',
            'genre_id.exists' => 'Thể loại không tồn tại hoặc không còn hoạt động.',
            'visual_style_id.exists' => 'Phong cách hình ảnh không tồn tại hoặc không còn hoạt động.',
            'aspect_ratio.in' => 'Tỷ lệ video không hợp lệ.',
            'ai_language.in' => 'Ngôn ngữ AI không hợp lệ.',
            'setting.array' => 'Dữ liệu bối cảnh không hợp lệ.',
        ];
    }
}
