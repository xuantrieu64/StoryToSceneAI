<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ScriptDialogue extends Model
{
    protected $fillable = ['script_id', 'character_id', 'line_order', 'dialogue_text'];
    protected $casts = ['script_id' => 'integer', 'character_id' => 'integer', 'line_order' => 'integer'];
    public function script(): BelongsTo
    {
        return $this->belongsTo(Script::class);
    }
    public function character(): BelongsTo
    {
        return $this->belongsTo(Character::class);
    }
    public function voiceovers(): HasMany
    {
        return $this->hasMany(Voiceover::class, 'dialogue_id');
    }
}
