<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('auth_users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('aud')->default('authenticated');
            $table->string('role')->default('authenticated');
            $table->string('email')->unique();
            $table->string('encrypted_password');
            $table->timestamp('email_confirmed_at')->nullable();
            $table->timestamp('invited_at')->nullable();
            $table->string('confirmation_token')->default('');
            $table->timestamp('confirmation_sent_at')->nullable();
            $table->string('recovery_token')->default('');
            $table->timestamp('recovery_sent_at')->nullable();
            $table->string('email_change_token_new')->default('');
            $table->string('email_change')->default('');
            $table->timestamp('email_change_sent_at')->nullable();
            $table->timestamp('last_sign_in_at')->nullable();
            $table->json('raw_app_meta_data')->nullable();
            $table->json('raw_user_meta_data')->nullable();
            $table->boolean('is_super_admin')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->string('phone')->nullable();
            $table->timestamp('phone_confirmed_at')->nullable();
            $table->string('phone_change')->default('');
            $table->string('phone_change_token')->default('');
            $table->timestamp('phone_change_sent_at')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->string('email_change_token_current')->default('');
            $table->integer('email_change_confirm_status')->default(0);
            $table->timestamp('banned_until')->nullable();
            $table->string('reauthentication_token')->default('');
            $table->timestamp('reauthentication_sent_at')->nullable();
            $table->boolean('is_sso_user')->default(false);
            $table->timestamp('deleted_at')->nullable();
            $table->boolean('is_anonymous')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auth_users');
    }
};
