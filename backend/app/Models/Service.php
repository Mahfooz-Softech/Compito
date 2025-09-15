<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'id',
        'title',
        'description',
        'price_min',
        'price_max',
        'duration_hours',
        'worker_id',
        'category_id',
    ];
    
    protected $casts = [
        'price_min' => 'decimal:2',
        'price_max' => 'decimal:2',
        'duration_hours' => 'decimal:2',
    ];
    
    // Relationships
    public function worker()
    {
        return $this->belongsTo(WorkerProfile::class, 'worker_id');
    }

    // Direct relation to profiles table using worker_id → profiles.id
    public function profile()
    {
        return $this->belongsTo(Profile::class, 'worker_id', 'id');
    }
    
    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }
    
    public function bookings()
    {
        return $this->hasMany(Booking::class, 'service_id');
    }
    
    public function favorites()
    {
        return $this->hasMany(Favorite::class, 'service_id');
    }
    
    public function serviceRequests()
    {
        return $this->hasMany(ServiceRequest::class, 'service_id');
    }
    
    public function offers()
    {
        return $this->hasMany(Offer::class, 'service_id');
    }
}
