<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'id',
        'customer_id',
        'worker_id',
        'service_id',
        'scheduled_date',
        'address',
        'notes',
        'total_amount',
        'status',
        'stripe_session_id',
        'stripe_payment_status',
        'stripe_payment_intent_id',
        'worker_completed_at',
        'customer_confirmed_at',
        'commission_rate',
        'commission_amount',
        'worker_payout',
    ];
    
    protected $casts = [
        'scheduled_date' => 'datetime',
        'total_amount' => 'decimal:2',
        'commission_rate' => 'decimal:4',
        'commission_amount' => 'decimal:2',
        'worker_payout' => 'decimal:2',
        'worker_completed_at' => 'datetime',
        'customer_confirmed_at' => 'datetime',
    ];
    
    // Relationships
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
    
    public function reviews()
    {
        return $this->hasMany(Review::class, 'booking_id');
    }
    
    public function payments()
    {
        return $this->hasMany(Payment::class, 'booking_id');
    }
    
    public function messages()
    {
        return $this->hasMany(Message::class, 'booking_id');
    }
    
    public function notifications()
    {
        return $this->hasMany(Notification::class, 'booking_id');
    }
    
    public function stripeCheckouts()
    {
        return $this->hasMany(StripeCheckout::class, 'session_id', 'stripe_session_id');
    }
}
