<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('voices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('provider_id')->constrained('ai_providers');   // [F-18] thay cho cột chuỗi provider
            $table->string('voice_code', 100);
            $table->string('display_name')->nullable();
            $table->string('language', 20)->nullable()->default('vi');
            $table->boolean('is_active')->default(true);                      // [F-18] ngừng dùng mà không xóa
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['provider_id', 'voice_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('voices');
    }
};
