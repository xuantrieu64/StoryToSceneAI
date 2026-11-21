<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiModel extends Model
{
    protected $fillable = [];
    public function prices()
    {
        return $this->hasMany(AiModelPrice::class, 'model_id');
    }
}
