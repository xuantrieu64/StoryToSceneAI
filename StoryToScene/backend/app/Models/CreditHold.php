<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CreditHold extends Model
{
    protected $fillable = [
        'wallet_id',
        'generation_request_id',
        'amount',
        'consumed_amount',
        'status',
        'idempotency_key',
        'expires_at',
        'settled_at',
    ];

    protected $casts = [
        'wallet_id' => 'integer',
        'generation_request_id' => 'integer',
        'amount' => 'integer',
        'consumed_amount' => 'integer',
        'expires_at' => 'datetime',
        'settled_at' => 'datetime',
    ];

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(CreditWallet::class, 'wallet_id');
    }
    public function generationRequest(): BelongsTo
    {
        return $this->belongsTo(AiGenerationRequest::class, 'generation_request_id');
    }
    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(CreditLedgerEntries::class, 'hold_id');
    }
}
