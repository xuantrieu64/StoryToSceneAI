<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EventCharacter extends Model
{
    protected $table = 'event_characters';
    public $timestamps = false;
    protected $fillable = ['event_id', 'character_id'];
}
