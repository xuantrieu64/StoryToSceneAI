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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_code', 100)->unique();
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('plan_id')->constrained('plans');
            $table->bigInteger('amount_vnd');
            $table->bigInteger('received_amount')->nullable();
            $table->string('payment_method', 50)->default('vietqr');
            $table->enum('status', ['pending', 'paid', 'failed', 'cancelled', 'expired'])->default('pending');
            $table->timestamp('expires_at');
            $table->timestamp('paid_at')->nullable();
            $table->string('bank_transaction_id', 100)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['user_id', 'created_at']);    // lịch sử đơn của user
            $table->index(['status', 'expires_at']);     // job hết hạn đơn pending
            $table->index('plan_id');
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
