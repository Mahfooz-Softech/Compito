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
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('booking_id');
            $table->uuid('customer_id');
            $table->uuid('worker_id');
            $table->decimal('total_amount', 10, 2);
            $table->decimal('commission_rate', 5, 4)->default(0.15);
            $table->decimal('commission_amount', 10, 2);
            $table->decimal('worker_payout', 10, 2);
            $table->string('payment_status')->default('pending');
            $table->string('payment_method')->nullable();
            $table->string('transaction_id')->nullable();
            $table->timestamps();
            
            $table->foreign('booking_id')->references('id')->on('bookings');
            $table->foreign('customer_id')->references('id')->on('profiles');
            $table->foreign('worker_id')->references('id')->on('worker_profiles');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
