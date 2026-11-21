<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Character extends Model
{
    protected $fillable = ['project_id', 'name', 'role_type', 'description', 'default_voice_id'];
    protected $casts = ['project_id' => 'integer', 'default_voice_id' => 'integer'];
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
    public function defaultVoice(): BelongsTo
    {
        return $this->belongsTo(Voice::class, 'default_voice_id');
    }
    public function dialogues(): HasMany
    {
        return $this->hasMany(ScriptDialogue::class);
    }
    public function events(): BelongsToMany
    {
        return $this->belongsToMany(Event::class, 'event_characters', 'character_id', 'event_id');
    }
}
