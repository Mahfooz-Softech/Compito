<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkerAvailability extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'id',
        'worker_id',
        'day_of_week',
        'start_time',
        'end_time',
        'is_available',
    ];
    
    protected $casts = [
        'day_of_week' => 'integer',
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
        'is_available' => 'boolean',
    ];
    
    // Relationships
    public function worker()
    {
        return $this->belongsTo(WorkerProfile::class, 'worker_id');
    }
}
