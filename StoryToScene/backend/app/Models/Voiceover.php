<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Voiceover extends Model
{
    protected $fillable = ['dialogue_id', 'voice_id', 'spoken_text', 'audio_path', 'duration_seconds', 'status', 'generation_request_id'];
    protected $casts = ['dialogue_id' => 'integer', 'voice_id' => 'integer', 'duration_seconds' => 'decimal:2', 'generation_request_id' => 'integer'];
    public function dialogue(): BelongsTo { return $this->belongsTo(ScriptDialogue::class, 'dialogue_id'); }
    public function voice(): BelongsTo { return $this->belongsTo(Voice::class); }
    public function generationRequest(): BelongsTo { return $this->belongsTo(AiGenerationRequest::class, 'generation_request_id'); }
}
