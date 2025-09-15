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
        Schema::create('blocked_conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('customer_id');
            $table->uuid('worker_id');
            $table->timestamp('blocked_at')->useCurrent();
            $table->timestamps();
            
            $table->foreign('customer_id')->references('id')->on('profiles');
            $table->foreign('worker_id')->references('id')->on('worker_profiles');
            $table->unique(['customer_id', 'worker_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('blocked_conversations');
    }
};
