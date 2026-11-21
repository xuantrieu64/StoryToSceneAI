<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('project_contexts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->unique()->constrained('projects')->cascadeOnDelete();
            $table->foreignId('context_preset_id')->nullable()->constrained('context_presets')->nullOnDelete();
            $table->string('style_name_snapshot');
            $table->text('style_description_snapshot')->nullable();
            $table->string('genre_name_snapshot');
            $table->text('genre_description_snapshot')->nullable();
            $table->string('era')->nullable();
            $table->string('location')->nullable();
            $table->text('people_description')->nullable();
            $table->text('costume_description')->nullable();
            $table->text('architecture_description')->nullable();
            $table->string('sign_language_text')->nullable();
            $table->text('life_details')->nullable();
            $table->text('negative_prompt')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_contexts');
    }
};
