<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceRequest extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'id',
        'customer_id',
        'service_id',
        'worker_id',
        'message_to_worker',
        'preferred_date',
        'location_address',
        'location_latitude',
        'location_longitude',
        'budget_min',
        'budget_max',
        'status',
        'worker_response',
        'expires_at',
    ];
    
    protected $casts = [
        'preferred_date' => 'datetime',
        'location_latitude' => 'decimal:8',
        'location_longitude' => 'decimal:8',
        'budget_min' => 'decimal:2',
        'budget_max' => 'decimal:2',
        'expires_at' => 'datetime',
    ];
    
    // Relationships
    public function customer()
    {
        return $this->belongsTo(Profile::class, 'customer_id');
    }
    
    public function service()
    {
        return $this->belongsTo(Service::class, 'service_id');
    }
    
    public function worker()
    {
        return $this->belongsTo(WorkerProfile::class, 'worker_id');
    }
    
    public function offers()
    {
        return $this->hasMany(Offer::class, 'service_request_id');
    }
}
