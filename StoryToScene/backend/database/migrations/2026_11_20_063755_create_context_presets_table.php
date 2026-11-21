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
        Schema::create('context_presets', function (Blueprint $table) {
            $table->id();
            $table->string('code', 100)->unique();
            $table->string('name');
            $table->string('era')->nullable();
            $table->string('location')->nullable();
            $table->text('people_description')->nullable();
            $table->text('costume_description')->nullable();
            $table->text('architecture_description')->nullable();
            $table->string('signage_text')->nullable();     // [F-17] trước đây: sign_language_text (giả định Q14: chữ trên biển hiệu)
            $table->text('life_details')->nullable();
            $table->text('negative_prompt')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();   // [F-15]
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('context_presets');
    }
};
