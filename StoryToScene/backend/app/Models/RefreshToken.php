<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RefreshToken extends Model
{
    protected $table = 'refresh_tokens';

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'family_id',
        'token_hash',
        'user_agent',
        'ip_address',
        'expires_at',
        'family_expires_at',
        'used_at',
        'revoked_at',
        'replaced_by',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'replaced_by' => 'integer',
        'expires_at' => 'datetime',
        'family_expires_at' => 'datetime',
        'used_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
