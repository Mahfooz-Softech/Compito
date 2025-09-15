<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StripeCheckout extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'id',
        'session_id',
        'payment_intent_id',
        'offer_id',
        'customer_id',
        'worker_id',
        'service_id',
        'amount',
        'currency',
        'payment_status',
        'stripe_response',
    ];
    
    protected $casts = [
        'amount' => 'integer', // Amount in cents
        'stripe_response' => 'array',
    ];
    
    // Relationships
    public function offer()
    {
        return $this->belongsTo(Offer::class, 'offer_id');
    }
    
    public function customer()
    {
        return $this->belongsTo(Profile::class, 'customer_id');
    }
    
    public function worker()
    {
        return $this->belongsTo(WorkerProfile::class, 'worker_id');
    }
    
    public function service()
    {
        return $this->belongsTo(Service::class, 'service_id');
    }
}
