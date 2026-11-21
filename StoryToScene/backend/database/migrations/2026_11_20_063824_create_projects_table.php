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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->foreignId('genre_id')->nullable()->constrained('genres')->nullOnDelete();
            $table->foreignId('visual_style_id')->nullable()->constrained('visual_styles')->nullOnDelete();
            $table->enum('aspect_ratio', ['16:9', '9:16', '1:1'])->default('16:9');
            $table->longText('original_story_text')->nullable();
            $table->enum('status', ['draft', 'processing', 'completed', 'failed', 'archived'])->default('draft');
            $table->softDeletes();                 // [F-11] xóa mềm; job dọn file rồi mới xóa cứng
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();

            $table->index(['user_id', 'updated_at'], 'IX_projects_user_updated');   // danh sách dự án mới nhất
            $table->index(['user_id', 'status'], 'IX_projects_user_status');
            $table->index('genre_id');
            $table->index('visual_style_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
