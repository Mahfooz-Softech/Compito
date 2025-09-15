<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingCheckout extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'id',
        'customer_id',
        'service_id',
        'worker_id',
        'scheduled_date',
        'address',
        'notes',
        'total_amount',
        'status',
    ];
    
    protected $casts = [
        'scheduled_date' => 'datetime',
        'total_amount' => 'decimal:2',
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
}
