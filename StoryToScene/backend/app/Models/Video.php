<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Video extends Model
{
    protected $fillable = ['shot_id', 'video_prompt', 'video_path', 'duration_seconds', 'status', 'generation_request_id'];
    protected $casts = ['shot_id' => 'integer', 'duration_seconds' => 'integer', 'generation_request_id' => 'integer'];
    public function shot(): BelongsTo { return $this->belongsTo(StoryboardShot::class, 'shot_id'); }
    public function generationRequest(): BelongsTo { return $this->belongsTo(AiGenerationRequest::class, 'generation_request_id'); }
}
