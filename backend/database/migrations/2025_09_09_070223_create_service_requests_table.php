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
        Schema::create('service_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('customer_id');
            $table->uuid('service_id');
            $table->uuid('worker_id');
            $table->text('message_to_worker')->nullable();
            $table->timestamp('preferred_date')->nullable();
            $table->text('location_address');
            $table->decimal('location_latitude', 10, 8)->nullable();
            $table->decimal('location_longitude', 11, 8)->nullable();
            $table->decimal('budget_min', 8, 2)->nullable();
            $table->decimal('budget_max', 8, 2)->nullable();
            $table->string('status')->default('pending');
            $table->text('worker_response')->nullable();
            $table->timestamp('expires_at')->default(DB::raw("now() + interval '24 hours'"));
            $table->timestamps();
            
            $table->foreign('customer_id')->references('id')->on('profiles');
            $table->foreign('service_id')->references('id')->on('services');
            $table->foreign('worker_id')->references('id')->on('worker_profiles');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_requests');
    }
};
