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
        Schema::create('reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('booking_id');
            $table->uuid('reviewer_id');
            $table->uuid('worker_id');
            $table->uuid('customer_id')->nullable();
            $table->integer('rating');
            $table->text('comment')->nullable();
            $table->string('review_type')->default('worker_review');
            $table->timestamps();
            
            $table->foreign('booking_id')->references('id')->on('bookings');
            $table->foreign('reviewer_id')->references('id')->on('profiles');
            $table->foreign('worker_id')->references('id')->on('worker_profiles');
            $table->foreign('customer_id')->references('id')->on('profiles');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
