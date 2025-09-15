<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Profile extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'id',
        'first_name',
        'last_name',
        'user_type',
        'phone',
        'location',
        'postcode',
        'latitude',
        'longitude',
        'city',
        'country',
        'customer_rating',
        'customer_total_reviews',
        'email',
    ];
    
    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'customer_rating' => 'decimal:2',
        'customer_total_reviews' => 'integer',
    ];
    
    // Relationships
    public function authUser()
    {
        return $this->belongsTo(AuthUser::class, 'id', 'id');
    }
    
    public function workerProfile()
    {
        return $this->hasOne(WorkerProfile::class, 'id', 'id');
    }
    
    public function bookings()
    {
        return $this->hasMany(Booking::class, 'customer_id');
    }
    
    public function reviews()
    {
        return $this->hasMany(Review::class, 'reviewer_id');
    }
    
    public function messages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }
    
    public function receivedMessages()
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }
    
    public function notifications()
    {
        return $this->hasMany(Notification::class, 'user_id');
    }
    
    public function favorites()
    {
        return $this->hasMany(Favorite::class, 'customer_id');
    }
    
    public function serviceRequests()
    {
        return $this->hasMany(ServiceRequest::class, 'customer_id');
    }
    
    public function offers()
    {
        return $this->hasMany(Offer::class, 'customer_id');
    }
}
