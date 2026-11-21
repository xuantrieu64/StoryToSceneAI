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
        Schema::create('script_dialogues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('script_id')->constrained('scripts')->cascadeOnDelete();
            // NULL = người dẫn chuyện
            $table->foreignId('character_id')->nullable()->constrained('characters')->noActionOnDelete();
            $table->integer('line_order');
            $table->longText('dialogue_text');
            $table->timestamp('created_at')->useCurrent();   // [F-15]
            $table->timestamp('updated_at')->useCurrent();

            $table->index(['script_id', 'line_order']);
            $table->index('character_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('script_dialogues');
    }
};
