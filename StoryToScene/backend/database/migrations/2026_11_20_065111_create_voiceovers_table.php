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
        Schema::create('voiceovers', function (Blueprint $table) {
            $table->id();
            // [F-10] Đã bỏ script_id (truy ngược qua dialogue_id -> script_dialogues.script_id)
            // Giả định Q13: một lời thoại có thể có nhiều bản thu nên dialogue_id không unique.
            $table->foreignId('dialogue_id')->constrained('script_dialogues')->cascadeOnDelete();
            $table->foreignId('voice_id')->constrained('voices');
            $table->longText('spoken_text');                    // bản đã chỉnh cho TTS, có thể khác dialogue_text
            $table->string('audio_path', 1000)->nullable();     // [F-31] đường dẫn tương đối
            $table->decimal('duration_seconds', 8, 2)->nullable();
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled'])->default('pending');
            $table->foreignId('generation_request_id')->nullable()->constrained('ai_generation_requests');
            $table->timestamp('created_at')->useCurrent();   // [F-15]
            $table->timestamp('updated_at')->useCurrent();

            $table->index('dialogue_id');
            $table->index('voice_id');
            $table->index('generation_request_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('voiceovers');
    }
};
