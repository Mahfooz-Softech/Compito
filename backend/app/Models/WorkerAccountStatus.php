<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkerAccountStatus extends Model
{
    protected $table = 'worker_account_status';
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'id',
        'worker_id',
        'is_active',
        'deactivated_at',
        'deactivation_reason',
        'reactivated_at',
        'reactivation_reason',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'deactivated_at' => 'datetime',
        'reactivated_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function workerProfile()
    {
        return $this->belongsTo(WorkerProfile::class, 'worker_id', 'id');
    }
}






