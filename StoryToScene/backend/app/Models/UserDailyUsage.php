<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserDailyUsage extends Model
{
    protected $fillable = [
        'user_id',
        'usage_date',
        'text_count',
        'standard_image_count',
        'premium_image_count',
        'tts_char_count',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'usage_date' => 'date',
        'text_count' => 'integer',
        'standard_image_count' => 'integer',
        'premium_image_count' => 'integer',
        'tts_char_count' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
