<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    protected $fillable = [
        'code',
        'name',
        'price_vnd',
        'is_purchasable',
        'duration_days',
        'max_projects',
        'max_words_per_project',
        'monthly_credits',
        'daily_text_limit',
        'daily_standard_image_limit',
        'daily_premium_image_limit',
        'monthly_tts_char_limit',
    ];

    protected $casts = [
        'price_vnd' => 'integer',
        'is_purchasable' => 'boolean',
        'duration_days' => 'integer',
        'max_projects' => 'integer',
        'max_words_per_project' => 'integer',
        'monthly_credits' => 'integer',
        'daily_text_limit' => 'integer',
        'daily_standard_image_limit' => 'integer',
        'daily_premium_image_limit' => 'integer',
        'monthly_tts_char_limit' => 'integer',
    ];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
}
