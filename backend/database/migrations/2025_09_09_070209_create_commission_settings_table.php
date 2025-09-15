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
        Schema::create('commission_settings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('worker_id')->nullable();
            $table->uuid('category_id')->nullable();
            $table->decimal('commission_rate', 5, 4);
            $table->boolean('is_global')->default(false);
            $table->timestamps();
            
            $table->foreign('worker_id')->references('id')->on('worker_profiles');
            $table->foreign('category_id')->references('id')->on('worker_categories');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('commission_settings');
    }
};
