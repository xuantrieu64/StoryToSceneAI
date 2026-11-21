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
        Schema::create('videos', function (Blueprint $table) {
            $table->id();
            // [F-10] Đã bỏ project_id (truy ngược shot -> script -> project)
            // [F-22] Đã bỏ aspect_ratio (dùng của project, giả định Q10)
            $table->foreignId('shot_id')->constrained('storyboard_shots')->cascadeOnDelete();
            $table->longText('video_prompt')->nullable();
            $table->string('video_path', 1000)->nullable();     // [F-31] đường dẫn tương đối
            $table->integer('duration_seconds')->default(5);
            // [F-12] 'processing' thay cho 'rendering' để thống nhất từ vựng
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled'])->default('pending');
            $table->foreignId('generation_request_id')->nullable()->constrained('ai_generation_requests');
            $table->timestamp('created_at')->useCurrent();   // [F-15]
            $table->timestamp('updated_at')->useCurrent();

            $table->index('shot_id');
            $table->index('generation_request_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('videos');
    }
};
