<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CreditWallet extends Model
{
    use HasFactory;

    public $timestamp = false;

    protected $fillable = [
        'user_id',
        'balance_available',
        'balance_held',
        'updated_at',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'balance_available' => 'integer',
        'balance_held' => 'integer',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
