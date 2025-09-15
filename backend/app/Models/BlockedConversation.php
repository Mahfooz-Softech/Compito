<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BlockedConversation extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'id',
        'customer_id',
        'worker_id',
        'blocked_at',
    ];
    
    protected $casts = [
        'blocked_at' => 'datetime',
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
}
