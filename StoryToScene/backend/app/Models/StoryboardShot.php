<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StoryboardShot extends Model
{
    protected $fillable = ['script_id', 'shot_number', 'shot_type', 'ai_image_prompt', 'image_path', 'generation_status', 'generation_request_id'];
    protected $casts = ['script_id' => 'integer', 'shot_number' => 'integer', 'generation_request_id' => 'integer'];
    public function script(): BelongsTo { return $this->belongsTo(Script::class); }
    public function generationRequest(): BelongsTo { return $this->belongsTo(AiGenerationRequest::class, 'generation_request_id'); }
    public function videos(): HasMany { return $this->hasMany(Video::class, 'shot_id'); }
}
