<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AiModelPrice extends Model
{
    protected $fillable = ['model_id', 'variant_code', 'unit_type', 'credit_cost', 'is_active', 'quota_category'];
    protected $casts = ['model_id' => 'integer', 'credit_cost' => 'integer', 'is_active' => 'boolean'];
    public function model(): BelongsTo
    {
        return $this->belongsTo(AiModel::class, 'model_id');
    }
    public function aiGenerationRequests(): HasMany
    {
        return $this->hasMany(AiGenerationRequest::class, 'price_id');
    }
}
