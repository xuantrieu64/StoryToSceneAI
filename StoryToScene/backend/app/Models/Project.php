<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id',
        'title',
        'project_type',
        'genre_note',
        'genre_id',
        'visual_style_id',
        'aspect_ratio',
        'ai_language',
        'original_story_text',
        'status',
    ];

    protected $casts = ['user_id' => 'integer', 'genre_id' => 'integer', 'visual_style_id' => 'integer'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function genre(): BelongsTo
    {
        return $this->belongsTo(Genre::class);
    }

    public function visualStyle(): BelongsTo
    {
        return $this->belongsTo(VisualStyle::class);
    }

    public function chapters(): HasMany
    {
        return $this->hasMany(Chapter::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }

    public function characters(): HasMany
    {
        return $this->hasMany(Character::class);
    }

    public function scripts(): HasMany
    {
        return $this->hasMany(Script::class);
    }

    public function aiGenerationRequests(): HasMany
    {
        return $this->hasMany(AiGenerationRequest::class);
    }

    public function projectContext(): HasOne
    {
        return $this->hasOne(ProjectContext::class);
    }
}
