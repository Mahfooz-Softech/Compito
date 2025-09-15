<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CommissionSetting extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'id',
        'worker_id',
        'category_id',
        'commission_rate',
        'is_global',
    ];
    
    protected $casts = [
        'commission_rate' => 'decimal:4',
        'is_global' => 'boolean',
    ];
    
    // Relationships
    public function worker()
    {
        return $this->belongsTo(WorkerProfile::class, 'worker_id');
    }
    
    public function category()
    {
        return $this->belongsTo(WorkerCategory::class, 'category_id');
    }
}
