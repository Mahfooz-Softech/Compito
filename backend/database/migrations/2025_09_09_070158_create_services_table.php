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
        Schema::create('services', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->text('description');
            $table->decimal('price_min', 8, 2);
            $table->decimal('price_max', 8, 2);
            $table->decimal('duration_hours', 4, 2);
            $table->uuid('worker_id');
            $table->uuid('category_id');
            $table->timestamps();
            
            $table->foreign('worker_id')->references('id')->on('worker_profiles');
            $table->foreign('category_id')->references('id')->on('categories');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
