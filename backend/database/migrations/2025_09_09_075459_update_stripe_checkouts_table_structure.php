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
        // Update stripe_checkouts table to match the SQL logic from fix_stripe_checkouts_table.sql
        Schema::table('stripe_checkouts', function (Blueprint $table) {
            // Drop existing foreign key and column
            $table->dropForeign(['booking_id']);
            $table->dropColumn('booking_id');
            
            // Rename existing columns
            $table->renameColumn('stripe_session_id', 'session_id');
            $table->renameColumn('stripe_payment_intent_id', 'payment_intent_id');
            
            // Add new columns based on the SQL structure
            $table->uuid('offer_id')->nullable();
            $table->uuid('customer_id');
            $table->uuid('worker_id');
            $table->uuid('service_id')->nullable();
            $table->string('payment_status');
            $table->json('stripe_response');
            
            // Add foreign key constraints
            $table->foreign('offer_id')->references('id')->on('offers')->onDelete('cascade');
            $table->foreign('customer_id')->references('id')->on('profiles')->onDelete('cascade');
            $table->foreign('worker_id')->references('id')->on('worker_profiles')->onDelete('cascade');
            $table->foreign('service_id')->references('id')->on('services')->onDelete('cascade');
            
            // Add indexes for better performance
            $table->index('session_id');
            $table->index('offer_id');
            $table->index('customer_id');
            $table->index('worker_id');
        });
        
        // Change amount column type in a separate operation
        Schema::table('stripe_checkouts', function (Blueprint $table) {
            $table->integer('amount')->change(); // Change from decimal to integer (cents)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stripe_checkouts', function (Blueprint $table) {
            // Drop foreign keys and indexes
            $table->dropForeign(['offer_id']);
            $table->dropForeign(['customer_id']);
            $table->dropForeign(['worker_id']);
            $table->dropForeign(['service_id']);
            
            $table->dropIndex(['session_id']);
            $table->dropIndex(['offer_id']);
            $table->dropIndex(['customer_id']);
            $table->dropIndex(['worker_id']);
            
            // Drop new columns
            $table->dropColumn(['offer_id', 'customer_id', 'worker_id', 'service_id', 'payment_status', 'stripe_response']);
            
            // Revert column renames
            $table->renameColumn('session_id', 'stripe_session_id');
            $table->renameColumn('payment_intent_id', 'stripe_payment_intent_id');
            
            // Add back booking_id
            $table->uuid('booking_id');
            $table->foreign('booking_id')->references('id')->on('bookings');
        });
        
        // Revert amount column type
        Schema::table('stripe_checkouts', function (Blueprint $table) {
            $table->decimal('amount', 10, 2)->change();
        });
    }
};
