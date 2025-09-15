<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Favorite extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'id',
        'customer_id',
        'worker_id',
        'service_id',
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
}
