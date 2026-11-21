<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectContext extends Model
{
    protected $fillable = [
        'project_id',
        'context_preset_id',
        'style_name_snapshot',
        'style_description_snapshot',
        'genre_name_snapshot',
        'genre_description_snapshot',
        'era',
        'location',
        'people_description',
        'costume_description',
        'architecture_description',
        'sign_language_text',
        'life_details',
        'negative_prompt',
    ];

    protected $casts = [
        'project_id' => 'integer',
        'context_preset_id' => 'integer',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function contextPreset(): BelongsTo
    {
        return $this->belongsTo(ContextPreset::class);
    }
}
