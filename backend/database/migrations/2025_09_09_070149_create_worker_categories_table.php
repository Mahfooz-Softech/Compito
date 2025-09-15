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
        Schema::create('worker_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->decimal('commission_rate', 5, 4)->default(0.15);
            $table->decimal('min_rating', 3, 2)->default(0);
            $table->integer('min_experience')->default(0);
            $table->integer('min_customers')->default(0);
            $table->string('color')->default('#6b7280');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('worker_categories');
    }
};
