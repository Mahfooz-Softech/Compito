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
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            // Drop the existing tokenable_id column
            $table->dropColumn('tokenable_id');
        });
        
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            // Add the new UUID tokenable_id column
            $table->uuid('tokenable_id')->after('tokenable_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            // Drop the UUID tokenable_id column
            $table->dropColumn('tokenable_id');
        });
        
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            // Add back the original bigint tokenable_id column
            $table->unsignedBigInteger('tokenable_id')->after('tokenable_type');
        });
    }
};