<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CreditLedgerEntries extends Model
{
    protected $table = 'credit_ledger_entries';

    protected $fillable = [
        'wallet_id',
        'entry_type',
        'available_delta',
        'held_delta',
        'available_after',
        'held_after',
        'lot_id',
        'hold_id',
        'idempotency_key',
    ];

    protected $casts = [
        'wallet_id' => 'integer',
        'available_delta' => 'integer',
        'held_delta' => 'integer',
        'available_after' => 'integer',
        'held_after' => 'integer',
        'lot_id' => 'integer',
        'hold_id' => 'integer',
        'created_at' => 'datetime',
    ];

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(CreditWallet::class, 'wallet_id');
    }
    public function lot(): BelongsTo
    {
        return $this->belongsTo(CreditLot::class, 'lot_id');
    }
    public function hold(): BelongsTo
    {
        return $this->belongsTo(CreditHold::class, 'hold_id');
    }
}
