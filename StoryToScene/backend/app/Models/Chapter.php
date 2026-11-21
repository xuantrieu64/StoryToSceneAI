<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Chapter extends Model
{
    protected $fillable = ['project_id', 'chapter_number', 'title', 'content_text'];
    protected $casts = ['project_id' => 'integer', 'chapter_number' => 'integer'];
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }
}
