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
        Schema::create('ai_model_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('model_id')->constrained('ai_models');
            $table->string('variant_code', 60);
            // [F-08] Đơn vị tính của credit_cost. Tập giá trị là giả định (Q5), chỉnh lại khi chốt nghiệp vụ.
            $table->enum('unit_type', ['request', 'image', '1k_chars', 'second']);
            $table->bigInteger('credit_cost');
            $table->boolean('is_active')->default(true);
            $table->enum('quota_category', ['text', 'image_standard', 'image_premium', 'tts_char'])->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_model_prices');
    }
};
