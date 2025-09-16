<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'id',
        'booking_id',
        'customer_id',
        'worker_id',
        'total_amount',
        'commission_rate',
        'commission_amount',
        'worker_payout',
        'payment_status',
        'worker_paid',
        'payment_method',
        'transaction_id',
    ];
    
    protected $casts = [
        'total_amount' => 'decimal:2',
        'commission_rate' => 'decimal:4',
        'commission_amount' => 'decimal:2',
        'worker_payout' => 'decimal:2',
        'worker_paid' => 'boolean',
    ];
    
    // Relationships
    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }
    
    public function customer()
    {
        return $this->belongsTo(Profile::class, 'customer_id');
    }
    
    public function worker()
    {
        return $this->belongsTo(WorkerProfile::class, 'worker_id');
    }
}
