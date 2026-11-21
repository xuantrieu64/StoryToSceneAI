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
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('plan_id')->constrained('plans');
            $table->foreignId('order_id')->nullable()->constrained('orders');
            $table->enum('status', ['active', 'expired', 'cancelled'])->default('active');
            $table->timestamp('starts_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();

            // [F-13] Snapshot quyền lợi của plan tại thời điểm đăng ký (giả định Q8: người đã mua giữ quyền lợi cũ).
            // Dùng Subscription::snapshotFrom($plan) để điền.
            $table->bigInteger('monthly_credits');
            $table->integer('max_projects');
            $table->integer('max_words_per_project');
            $table->integer('daily_text_limit');
            $table->integer('daily_standard_image_limit');
            $table->integer('daily_premium_image_limit');
            $table->integer('monthly_tts_char_limit');

            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'status', 'expires_at']);
            $table->index('plan_id');
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
