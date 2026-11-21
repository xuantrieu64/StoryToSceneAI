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
        Schema::create('credit_ledger_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('wallet_id')->constrained('credit_wallets');
            $table->enum('entry_type', ['grant', 'refund', 'hold', 'consume', 'release', 'expire']);
            $table->bigInteger('available_delta');
            $table->bigInteger('held_delta');
            $table->bigInteger('available_after');
            $table->bigInteger('held_after');
            $table->foreignId('lot_id')->nullable()->constrained('credit_lots');
            $table->foreignId('hold_id')->nullable()->constrained('credit_holds');
            $table->string('idempotency_key', 150)->unique();
            $table->timestamp('created_at', 6)->useCurrent();

            $table->index(['wallet_id', 'id']);
            $table->index('lot_id');
            $table->index('hold_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('credit_ledger_entries');
    }
};
