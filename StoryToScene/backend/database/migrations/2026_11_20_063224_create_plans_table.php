<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name');
            $table->bigInteger('price_vnd')->default(0);
            $table->boolean('is_purchasable')->default(true);
            $table->integer('duration_days')->default(30);
            $table->integer('max_projects')->default(1);
            $table->integer('max_words_per_project')->default(10000);
            $table->bigInteger('monthly_credits')->default(0);
            $table->integer('daily_text_limit')->default(30);
            $table->integer('daily_standard_image_limit')->default(20);
            $table->integer('daily_premium_image_limit')->default(10);
            $table->integer('monthly_tts_char_limit')->default(50000);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
