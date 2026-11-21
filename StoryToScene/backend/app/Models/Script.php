<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Script extends Model
{
    protected $fillable = ['project_id', 'event_id', 'scene_number', 'scene_heading', 'action_description'];
    protected $casts = ['project_id' => 'integer', 'event_id' => 'integer', 'scene_number' => 'integer'];
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }
    public function dialogues(): HasMany
    {
        return $this->hasMany(ScriptDialogue::class);
    }
    public function shots(): HasMany
    {
        return $this->hasMany(StoryboardShot::class);
    }
}
