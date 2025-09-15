<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('worker_account_status')) {
            Schema::create('worker_account_status', function (Blueprint $table) {
                // Keep an id for compatibility with Eloquent, though not strictly required
                $table->uuid('id')->primary();
                $table->uuid('worker_id')->unique();
                $table->boolean('is_active')->default(true);
                $table->timestamp('deactivated_at')->nullable();
                $table->text('deactivation_reason')->nullable();
                $table->timestamp('reactivated_at')->nullable();
                $table->text('reactivation_reason')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('worker_account_status');
    }
};







