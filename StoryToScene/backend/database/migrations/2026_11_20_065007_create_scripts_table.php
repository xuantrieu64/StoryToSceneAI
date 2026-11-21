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
        Schema::create('scripts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('event_id')->nullable()->constrained('events');
            $table->integer('scene_number');
            $table->string('scene_heading');
            $table->longText('action_description');
            $table->timestamp('created_at')->useCurrent();   // [F-15]
            $table->timestamp('updated_at')->useCurrent();

            $table->index(['project_id', 'scene_number']);
            $table->index('event_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scripts');
    }
};
