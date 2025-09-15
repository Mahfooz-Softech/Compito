<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Offer extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'id',
        'service_request_id',
        'worker_id',
        'customer_id',
        'service_id',
        'price',
        'estimated_hours',
        'description',
        'status',
        'expires_at',
    ];
    
    protected $casts = [
        'price' => 'decimal:2',
        'estimated_hours' => 'decimal:2',
        'expires_at' => 'datetime',
    ];
    
    // Relationships
    public function serviceRequest()
    {
        return $this->belongsTo(ServiceRequest::class, 'service_request_id');
    }
    
    public function worker()
    {
        return $this->belongsTo(WorkerProfile::class, 'worker_id');
    }
    
    public function customer()
    {
        return $this->belongsTo(Profile::class, 'customer_id');
    }
    
    public function service()
    {
        return $this->belongsTo(Service::class, 'service_id');
    }
}
