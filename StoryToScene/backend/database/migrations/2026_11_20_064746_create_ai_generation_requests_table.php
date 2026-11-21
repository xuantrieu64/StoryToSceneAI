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
        Schema::create('ai_generation_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('wallet_id')->constrained('credit_wallets');
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            // [F-07] Đã bỏ capability và model_id: truy ngược qua price_id -> ai_model_prices.model_id -> ai_models.capability
            $table->foreignId('price_id')->constrained('ai_model_prices');
            $table->text('prompt')->nullable();
            $table->bigInteger('credits_amount');
            $table->integer('units_count')->default(1);
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled'])->default('pending');
            $table->string('idempotency_key', 120)->unique();
            $table->string('provider_task_id', 100)->nullable();
            $table->string('error_message', 500)->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'created_at']);
            $table->index('project_id');
            $table->index('price_id');
            $table->index('wallet_id');
            $table->index(['status', 'created_at'], 'IX_ai_req_status_created');
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_generation_requests');
    }
};
