<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiGenerationRequest extends Model
{
    protected $fillable = [
        'user_id',
        'wallet_id',
        'project_id',
        'price_id',
        'prompt',
        'credits_amount',
        'units_count',
        'status',
        'idempotency_key',
        'provider_task_id',
        'error_message',
        'completed_at',
    ];
    protected $casts = [
        'user_id' => 'integer',
        'wallet_id' => 'integer',
        'project_id' => 'integer',
        'price_id' => 'integer',
        'credits_amount' => 'integer',
        'units_count' => 'integer',
        'completed_at' => 'datetime',
        'created_at' => 'datetime',
    ];
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    public function wallet(): BelongsTo
    {
        return $this->belongsTo(CreditWallet::class, 'wallet_id');
    }
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
    public function price(): BelongsTo
    {
        return $this->belongsTo(AiModelPrice::class, 'price_id');
    }
    public function holds(): HasMany
    {
        return $this->hasMany(CreditHold::class, 'generation_request_id');
    }
    public function storyboardShots(): HasMany
    {
        return $this->hasMany(StoryboardShot::class, 'generation_request_id');
    }
    public function voiceovers(): HasMany
    {
        return $this->hasMany(Voiceover::class, 'generation_request_id');
    }
    public function videos(): HasMany
    {
        return $this->hasMany(Video::class, 'generation_request_id');
    }
}
