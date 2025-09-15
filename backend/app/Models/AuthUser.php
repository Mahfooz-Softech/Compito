<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class AuthUser extends Authenticatable
{
    use HasApiTokens;
    
    protected $table = 'auth_users';
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'id',
        'aud',
        'role',
        'email',
        'encrypted_password',
        'email_confirmed_at',
        'invited_at',
        'confirmation_token',
        'confirmation_sent_at',
        'recovery_token',
        'recovery_sent_at',
        'email_change_token_new',
        'email_change',
        'email_change_sent_at',
        'last_sign_in_at',
        'raw_app_meta_data',
        'raw_user_meta_data',
        'is_super_admin',
        'phone',
        'phone_confirmed_at',
        'phone_change',
        'phone_change_token',
        'phone_change_sent_at',
        'confirmed_at',
        'email_change_token_current',
        'email_change_confirm_status',
        'banned_until',
        'reauthentication_token',
        'reauthentication_sent_at',
        'is_sso_user',
        'deleted_at',
        'is_anonymous',
    ];
    
    protected $casts = [
        'raw_app_meta_data' => 'array',
        'raw_user_meta_data' => 'array',
        'email_confirmed_at' => 'datetime',
        'invited_at' => 'datetime',
        'confirmation_sent_at' => 'datetime',
        'recovery_sent_at' => 'datetime',
        'email_change_sent_at' => 'datetime',
        'last_sign_in_at' => 'datetime',
        'phone_confirmed_at' => 'datetime',
        'phone_change_sent_at' => 'datetime',
        'confirmed_at' => 'datetime',
        'banned_until' => 'datetime',
        'reauthentication_sent_at' => 'datetime',
        'deleted_at' => 'datetime',
        'is_super_admin' => 'boolean',
        'is_sso_user' => 'boolean',
        'is_anonymous' => 'boolean',
        'email_change_confirm_status' => 'integer',
    ];
    
    // Relationships
    public function profile()
    {
        return $this->hasOne(Profile::class, 'id', 'id');
    }
    
    // Helper methods
    public function isEmailConfirmed()
    {
        return !is_null($this->email_confirmed_at);
    }
    
    public function isPhoneConfirmed()
    {
        return !is_null($this->phone_confirmed_at);
    }
    
    public function isBanned()
    {
        return !is_null($this->banned_until) && $this->banned_until > now();
    }
    
    public function getUserType()
    {
        return $this->raw_user_meta_data['user_type'] ?? 'customer';
    }
    
    public function getFirstName()
    {
        return $this->raw_user_meta_data['first_name'] ?? '';
    }
    
    public function getLastName()
    {
        return $this->raw_user_meta_data['last_name'] ?? '';
    }
}
