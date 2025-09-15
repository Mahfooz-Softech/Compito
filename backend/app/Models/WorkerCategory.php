<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkerCategory extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'id',
        'name',
        'description',
        'commission_rate',
        'min_rating',
        'min_experience',
        'min_customers',
        'color',
    ];
    
    protected $casts = [
        'commission_rate' => 'decimal:4',
        'min_rating' => 'decimal:2',
        'min_experience' => 'integer',
        'min_customers' => 'integer',
    ];
    
    // Relationships
    public function workerProfiles()
    {
        return $this->hasMany(WorkerProfile::class, 'category_id');
    }
    
    public function commissionSettings()
    {
        return $this->hasMany(CommissionSetting::class, 'category_id');
    }
}
