<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkerProfile extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'id',
        'bio',
        'experience_years',
        'hourly_rate',
        'is_available',
        'is_verified',
        'is_online',
        'rating',
        'total_reviews',
        'total_earnings',
        'completed_jobs',
        'skills',
        'certifications',
        'verification_status',
        'verified_at',
        'verified_by',
        'category_id',
        'service_radius_miles',
        'online_services',
        'last_seen',
    ];
    
    protected $casts = [
        'experience_years' => 'integer',
        'hourly_rate' => 'decimal:2',
        'is_available' => 'boolean',
        'is_verified' => 'boolean',
        'is_online' => 'boolean',
        'rating' => 'decimal:2',
        'total_reviews' => 'integer',
        'total_earnings' => 'decimal:2',
        'completed_jobs' => 'integer',
        'skills' => 'array',
        'certifications' => 'array',
        'service_radius_miles' => 'integer',
        'online_services' => 'boolean',
        'verified_at' => 'datetime',
        'last_seen' => 'datetime',
    ];
    
    // Relationships
    public function profile()
    {
        return $this->belongsTo(Profile::class, 'id', 'id');
    }
    
    public function category()
    {
        return $this->belongsTo(WorkerCategory::class, 'category_id');
    }
    
    public function verifiedBy()
    {
        return $this->belongsTo(Profile::class, 'verified_by');
    }
    
    public function services()
    {
        return $this->hasMany(Service::class, 'worker_id');
    }
    
    public function bookings()
    {
        return $this->hasMany(Booking::class, 'worker_id');
    }
    
    public function reviews()
    {
        return $this->hasMany(Review::class, 'worker_id');
    }
    
    public function payments()
    {
        return $this->hasMany(Payment::class, 'worker_id');
    }
    
    public function availability()
    {
        return $this->hasMany(WorkerAvailability::class, 'worker_id');
    }
    
    public function serviceRequests()
    {
        return $this->hasMany(ServiceRequest::class, 'worker_id');
    }
    
    public function offers()
    {
        return $this->hasMany(Offer::class, 'worker_id');
    }
    
    public function favorites()
    {
        return $this->hasMany(Favorite::class, 'worker_id');
    }
}
