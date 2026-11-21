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
        Schema::create('characters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('name');
            $table->string('role_type', 100)->nullable();
            $table->text('description')->nullable();
            $table->foreignId('default_voice_id')->nullable()->constrained('voices');
            $table->timestamp('created_at')->useCurrent();   // [F-15]
            $table->timestamp('updated_at')->useCurrent();

            $table->index('project_id');
            $table->index('default_voice_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('characters');
    }
};
