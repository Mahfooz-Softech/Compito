<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountActivationRequest extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'id',
        'worker_id',
        'request_reason',
        'status',
        'admin_response',
        'admin_id',
    ];
    
    // Relationships
    public function worker()
    {
        return $this->belongsTo(Profile::class, 'worker_id');
    }
    
    public function admin()
    {
        return $this->belongsTo(Profile::class, 'admin_id');
    }
}
