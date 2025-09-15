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
        Schema::create('bookings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('customer_id');
            $table->uuid('worker_id');
            $table->uuid('service_id');
            $table->timestamp('scheduled_date');
            $table->text('address');
            $table->text('notes')->nullable();
            $table->decimal('total_amount', 10, 2);
            $table->string('status')->default('pending_payment');
            $table->string('stripe_session_id')->nullable();
            $table->string('stripe_payment_status')->default('pending');
            $table->string('stripe_payment_intent_id')->nullable();
            $table->timestamp('worker_completed_at')->nullable();
            $table->timestamp('customer_confirmed_at')->nullable();
            $table->decimal('commission_rate', 5, 4)->default(0.15);
            $table->decimal('commission_amount', 10, 2)->nullable();
            $table->decimal('worker_payout', 10, 2)->nullable();
            $table->timestamps();
            
            $table->foreign('customer_id')->references('id')->on('profiles');
            $table->foreign('worker_id')->references('id')->on('worker_profiles');
            $table->foreign('service_id')->references('id')->on('services');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
