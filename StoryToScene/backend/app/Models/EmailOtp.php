<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Prunable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailOtp extends Model
{
    use Prunable;

    protected $fillable = [
        'user_id',
        'email',
        'purpose',
        'otp_hash',
        'attempts',
        'expires_at',
        'last_sent_at',
        'consumed_at',
    ];

    protected $hidden = ['otp_hash'];

    protected $casts = [
        'user_id' => 'integer',
        'attempts' => 'integer',
        'expires_at' => 'datetime',
        'last_sent_at' => 'datetime',
        'consumed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function prunable(): Builder
    {
        return static::query()->where('expires_at', '<', now()->subDay());
    }
}
