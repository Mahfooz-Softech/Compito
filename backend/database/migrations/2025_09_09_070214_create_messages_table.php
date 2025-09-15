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
        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('booking_id');
            $table->uuid('sender_id');
            $table->uuid('receiver_id');
            $table->text('message_text');
            $table->boolean('is_read')->default(false);
            $table->timestamps();
            
            $table->foreign('booking_id')->references('id')->on('bookings');
            $table->foreign('sender_id')->references('id')->on('profiles');
            $table->foreign('receiver_id')->references('id')->on('profiles');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
