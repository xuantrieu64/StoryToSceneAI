<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'order_code',
        'user_id',
        'plan_id',
        'amount_vnd',
        'received_amount',
        'payment_method',
        'status',
        'expires_at',
        'paid_at',
        'bank_transaction_id',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'plan_id' => 'integer',
        'amount_vnd' => 'integer',
        'received_amount' => 'integer',
        'expires_at' => 'datetime',
        'paid_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
}
