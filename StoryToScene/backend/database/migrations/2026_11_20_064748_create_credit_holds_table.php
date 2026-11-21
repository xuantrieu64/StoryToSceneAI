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
        Schema::create('credit_holds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wallet_id')->constrained('credit_wallets');
            $table->foreignId('generation_request_id')->nullable()->constrained('ai_generation_requests');
            $table->bigInteger('amount');
            $table->bigInteger('consumed_amount')->default(0);
            // Quy ước (Q6): hold dùng một phần thì phần dư được release, status cuối là 'consumed' với consumed_amount < amount
            $table->enum('status', ['held', 'consumed', 'released'])->default('held');
            $table->string('idempotency_key', 120)->unique();
            $table->timestamp('expires_at');
            $table->timestamp('settled_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['status', 'expires_at'], 'IX_holds_status_expires');
            $table->index(['wallet_id', 'status']);
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('credit_holds');
    }
};
