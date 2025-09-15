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
        Schema::create('worker_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->text('bio')->nullable();
            $table->integer('experience_years')->default(0);
            $table->decimal('hourly_rate', 8, 2)->default(0);
            $table->boolean('is_available')->default(true);
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_online')->default(false);
            $table->decimal('rating', 3, 2)->default(0);
            $table->integer('total_reviews')->default(0);
            $table->decimal('total_earnings', 10, 2)->default(0);
            $table->integer('completed_jobs')->default(0);
            $table->json('skills')->nullable(); // Array of skills
            $table->json('certifications')->nullable(); // Array of certifications
            $table->string('verification_status')->default('pending');
            $table->timestamp('verified_at')->nullable();
            $table->uuid('verified_by')->nullable();
            $table->uuid('category_id')->nullable();
            $table->string('location')->nullable();
            $table->string('postcode')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->string('city')->nullable();
            $table->string('country')->default('USA');
            $table->integer('service_radius_miles')->default(5);
            $table->timestamp('last_seen')->nullable();
            $table->timestamps();
            
            $table->foreign('verified_by')->references('id')->on('profiles');
            $table->foreign('category_id')->references('id')->on('worker_categories');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('worker_profiles');
    }
};
