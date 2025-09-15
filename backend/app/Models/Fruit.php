<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fruit extends Model
{
    protected $table = 'my_fruits';
    
    protected $fillable = [
        'name',
        'color',
        'price',
        'quantity',
        'description',
        'origin_country',
        'is_organic',
        'harvest_date',
    ];
    
    protected $casts = [
        'price' => 'decimal:2',
        'is_organic' => 'boolean',
        'harvest_date' => 'date',
    ];
}
