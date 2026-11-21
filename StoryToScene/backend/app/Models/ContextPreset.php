<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ContextPreset extends Model
{
    protected $fillable = [
        'code',
        'name',
        'era',
        'location',
        'people_description',
        'costume_description',
        'architecture_description',
        'signage_text',
        'life_details',
        'negative_prompt',
        'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    public function projectContexts(): HasMany
    {
        return $this->hasMany(ProjectContext::class);
    }
}
