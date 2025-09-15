<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop location-related columns from worker_profiles; source of truth is profiles
        Schema::table('worker_profiles', function (Blueprint $table) {
            // Use try/catch-like guards as some schemas may already not have these
            if (Schema::hasColumn('worker_profiles', 'location')) {
                $table->dropColumn('location');
            }
            if (Schema::hasColumn('worker_profiles', 'city')) {
                $table->dropColumn('city');
            }
            if (Schema::hasColumn('worker_profiles', 'postcode')) {
                $table->dropColumn('postcode');
            }
            if (Schema::hasColumn('worker_profiles', 'country')) {
                $table->dropColumn('country');
            }
            if (Schema::hasColumn('worker_profiles', 'latitude')) {
                $table->dropColumn('latitude');
            }
            if (Schema::hasColumn('worker_profiles', 'longitude')) {
                $table->dropColumn('longitude');
            }
        });
    }

    public function down(): void
    {
        Schema::table('worker_profiles', function (Blueprint $table) {
            if (!Schema::hasColumn('worker_profiles', 'location')) {
                $table->string('location')->nullable();
            }
            if (!Schema::hasColumn('worker_profiles', 'city')) {
                $table->string('city')->nullable();
            }
            if (!Schema::hasColumn('worker_profiles', 'postcode')) {
                $table->string('postcode')->nullable();
            }
            if (!Schema::hasColumn('worker_profiles', 'country')) {
                $table->string('country', 100)->nullable();
            }
            if (!Schema::hasColumn('worker_profiles', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable();
            }
            if (!Schema::hasColumn('worker_profiles', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable();
            }
        });
    }
};







