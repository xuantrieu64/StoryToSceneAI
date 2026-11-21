<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    protected $fillable = ['project_id', 'chapter_id', 'event_order', 'summary'];
    protected $casts = ['project_id' => 'integer', 'chapter_id' => 'integer', 'event_order' => 'integer'];
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }
    public function scripts(): HasMany
    {
        return $this->hasMany(Script::class);
    }
    public function characters(): BelongsToMany
    {
        return $this->belongsToMany(Character::class, 'event_characters', 'event_id', 'character_id');
    }
}
