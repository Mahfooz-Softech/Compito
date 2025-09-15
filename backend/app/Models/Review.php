<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'id',
        'booking_id',
        'reviewer_id',
        'worker_id',
        'customer_id',
        'rating',
        'comment',
        'review_type',
    ];
    
    protected $casts = [
        'rating' => 'integer',
    ];
    
    // Relationships
    public function booking()
    {
        return $this->belongsTo(Booking::class, 'booking_id');
    }
    
    public function reviewer()
    {
        return $this->belongsTo(Profile::class, 'reviewer_id');
    }
    
    public function worker()
    {
        return $this->belongsTo(WorkerProfile::class, 'worker_id');
    }
    
    public function customer()
    {
        return $this->belongsTo(Profile::class, 'customer_id');
    }
}
