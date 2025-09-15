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
        Schema::create('offers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('service_request_id')->nullable();
            $table->uuid('worker_id');
            $table->uuid('customer_id');
            $table->uuid('service_id')->nullable();
            $table->decimal('price', 10, 2);
            $table->decimal('estimated_hours', 4, 2);
            $table->text('description');
            $table->string('status')->default('pending');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            
            // $table->foreign('service_request_id')->references('id')->on('service_requests');
            $table->foreign('worker_id')->references('id')->on('worker_profiles');
            $table->foreign('customer_id')->references('id')->on('profiles');
            $table->foreign('service_id')->references('id')->on('services');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('offers');
    }
};
