<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'id',
        'booking_id',
        'sender_id',
        'receiver_id',
        'message_text',
        'is_read',
    ];
    
    protected $casts = [
        'is_read' => 'boolean',
    ];
    
    // Relationships
    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }
    
    public function sender()
    {
        return $this->belongsTo(Profile::class, 'sender_id');
    }
    
    public function receiver()
    {
        return $this->belongsTo(Profile::class, 'receiver_id');
    }
}
