<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('account_activation_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('worker_id');
            $table->text('request_reason')->nullable();
            $table->string('status')->default('pending');
            $table->text('admin_response')->nullable();
            $table->uuid('admin_id')->nullable();
            $table->timestamps();
            
            $table->foreign('worker_id')->references('id')->on('profiles')->onDelete('cascade');
            $table->foreign('admin_id')->references('id')->on('profiles')->onDelete('set null');
            
            // Check constraint will be added via raw SQL
        });
        
        // Add check constraint for status
        DB::statement('ALTER TABLE account_activation_requests ADD CONSTRAINT check_status CHECK (status IN (\'pending\', \'approved\', \'rejected\'))');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('account_activation_requests');
    }
};
