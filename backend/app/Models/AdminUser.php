<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminUser extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'id',
        'user_id',
        'role',
        'permissions',
        'created_by',
        'is_active',
    ];
    
    protected $casts = [
        'permissions' => 'array',
        'is_active' => 'boolean',
    ];
    
    // Relationships
    public function user()
    {
        return $this->belongsTo(Profile::class, 'user_id');
    }
    
    public function createdBy()
    {
        return $this->belongsTo(Profile::class, 'created_by');
    }
}
