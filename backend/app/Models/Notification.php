<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'id',
        'user_id',
        'booking_id',
        'type',
        'title',
        'message',
        'data',
        'is_read',
    ];
    
    protected $casts = [
        'is_read' => 'boolean',
        'data' => 'array',
    ];
    
    // Relationships
    public function user()
    {
        return $this->belongsTo(Profile::class, 'user_id');
    }
    
    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }
}
