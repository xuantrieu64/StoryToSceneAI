<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiProvider extends Model
{
    protected $fillable = [];
    public function voices()
    {
        return $this->hasMany(Voice::class, 'provider_id');
    }
}
