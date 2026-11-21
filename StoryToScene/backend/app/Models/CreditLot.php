<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CreditLot extends Model
{
    protected $fillable = [
        'wallet_id',
        'source_type',
        'source_id',
        'grant_key',
        'initial_amount',
        'remaining_amount',
        'held_amount',
        'consumed_amount',
        'expired_amount',
        'expires_at',
        'status',
    ];

    protected $casts = [
        'wallet_id' => 'integer',
        'source_id' => 'integer',
        'initial_amount' => 'integer',
        'remaining_amount' => 'integer',
        'held_amount' => 'integer',
        'consumed_amount' => 'integer',
        'expired_amount' => 'integer',
        'expires_at' => 'datetime',
    ];

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(CreditWallet::class, 'wallet_id');
    }
    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(CreditLedgerEntries::class, 'lot_id');
    }
}
