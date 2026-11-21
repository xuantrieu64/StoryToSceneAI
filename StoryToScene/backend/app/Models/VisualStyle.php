<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VisualStyle extends Model
{
    protected $fillable = ['code', 'name', 'description', 'preview_image_url', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];
    public function projects(): HasMany { return $this->hasMany(Project::class); }
}
