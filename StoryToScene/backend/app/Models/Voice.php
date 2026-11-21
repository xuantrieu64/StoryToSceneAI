<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Voice extends Model
{
    protected $fillable = ['provider_id', 'voice_code', 'display_name', 'language', 'is_active'];
    protected $casts = ['provider_id' => 'integer', 'is_active' => 'boolean'];
    public function provider(): BelongsTo { return $this->belongsTo(AiProvider::class, 'provider_id'); }
    public function characters(): HasMany { return $this->hasMany(Character::class, 'default_voice_id'); }
    public function voiceovers(): HasMany { return $this->hasMany(Voiceover::class); }
}
