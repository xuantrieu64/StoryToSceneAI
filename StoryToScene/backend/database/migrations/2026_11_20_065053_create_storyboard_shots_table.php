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
        Schema::create('storyboard_shots', function (Blueprint $table) {
            $table->id();
            // [F-10] Đã bỏ project_id (truy ngược qua scripts.project_id).
            // [F-22] Đã bỏ aspect_ratio (giả định Q10: shot dùng aspect_ratio của project).
            $table->foreignId('script_id')->constrained('scripts')->cascadeOnDelete();
            $table->integer('shot_number');
            $table->enum('shot_type', ['wide', 'medium', 'close_up'])->default('medium');
            $table->longText('ai_image_prompt');
            $table->string('image_path', 1000)->nullable();     // [F-31] đường dẫn tương đối trong storage, không lưu URL tuyệt đối
            // [F-12] Từ vựng trạng thái thống nhất với ai_generation_requests; nguồn sự thật là request
            $table->enum('generation_status', ['pending', 'processing', 'completed', 'failed', 'cancelled'])->default('pending');
            $table->foreignId('generation_request_id')->nullable()->constrained('ai_generation_requests');
            $table->timestamp('created_at')->useCurrent();   // [F-15]
            $table->timestamp('updated_at')->useCurrent();

            $table->index(['script_id', 'shot_number']);
            $table->index('generation_request_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('storyboard_shots');
    }
};
