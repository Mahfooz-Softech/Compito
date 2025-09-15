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
        Schema::create('booking_checkout', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('customer_id');
            $table->uuid('service_id');
            $table->uuid('worker_id');
            $table->timestamp('scheduled_date');
            $table->text('address');
            $table->text('notes')->nullable();
            $table->decimal('total_amount', 10, 2);
            $table->string('status')->default('pending');
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
        Schema::dropIfExists('booking_checkout');
    }
};
