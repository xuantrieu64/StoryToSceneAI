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
        Schema::create('credit_lots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wallet_id')->constrained('credit_wallets');
            $table->enum('source_type', ['subscription', 'free_daily', 'topup', 'promo', 'refund']);
            $table->bigInteger('source_id')->nullable();
            $table->string('grant_key', 100)->unique();
            $table->bigInteger('initial_amount');
            $table->bigInteger('remaining_amount');
            $table->bigInteger('held_amount')->default(0);
            $table->bigInteger('consumed_amount')->default(0);
            $table->bigInteger('expired_amount')->default(0);      // [F-02] phần mất do hết hạn
            $table->timestamp('expires_at')->nullable();
            $table->enum('status', ['active', 'depleted', 'expired'])->default('active');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['wallet_id', 'status', 'expires_at']);  // chọn lô FIFO gần hết hạn
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('credit_lots');
    }
};
