<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class CreditWallet extends Model
{
    use HasFactory;

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

    public function lots(): HasMany
    {
        return $this->hasMany(CreditLot::class, 'wallet_id');
    }
    public function holds(): HasMany
    {
        return $this->hasMany(CreditHold::class, 'wallet_id');
    }
    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(CreditLedgerEntries::class, 'wallet_id');
    }
    public function aiGenerationRequests(): HasMany
    {
        return $this->hasMany(AiGenerationRequest::class, 'wallet_id');
    }
}
