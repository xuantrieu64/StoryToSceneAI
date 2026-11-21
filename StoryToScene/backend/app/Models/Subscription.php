<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    protected $fillable = [
        'user_id',
        'plan_id',
        'order_id',
        'status',
        'starts_at',
        'expires_at',
        'monthly_credits',
        'max_projects',
        'max_words_per_project',
        'daily_text_limit',
        'daily_standard_image_limit',
        'daily_premium_image_limit',
        'monthly_tts_char_limit',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'plan_id' => 'integer',
        'order_id' => 'integer',
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
        'monthly_credits' => 'integer',
        'max_projects' => 'integer',
        'max_words_per_project' => 'integer',
        'daily_text_limit' => 'integer',
        'daily_standard_image_limit' => 'integer',
        'daily_premium_image_limit' => 'integer',
        'monthly_tts_char_limit' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
