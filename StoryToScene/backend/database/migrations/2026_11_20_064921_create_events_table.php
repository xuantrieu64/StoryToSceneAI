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
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            // NO ACTION bắt buộc: SQL Server cấm "multiple cascade paths"
            $table->foreignId('chapter_id')->nullable()->constrained('chapters')->noActionOnDelete();
            $table->integer('event_order');
            $table->longText('summary');
            $table->timestamp('created_at')->useCurrent();   // [F-15]
            $table->timestamp('updated_at')->useCurrent();

            $table->index(['project_id', 'event_order']);
            $table->index('chapter_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('events');
    }
};
