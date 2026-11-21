<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $now = now();

        // Independent seed records
        $plans = [];
        for ($i = 1; $i <= 10; $i++) {
            $planId = DB::table('plans')->updateOrInsert(
                ['code' => "plan_{$i}"],
                [
                    'name' => "Gói {$i}",
                    'price_vnd' => $i * 100000,
                    'is_purchasable' => true,
                    'duration_days' => 30,
                    'max_projects' => $i,
                    'max_words_per_project' => 10000 * $i,
                    'monthly_credits' => 100 * $i,
                    'daily_text_limit' => 30,
                    'daily_standard_image_limit' => 20,
                    'daily_premium_image_limit' => 10,
                    'monthly_tts_char_limit' => 50000,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            ) ? DB::table('plans')->where('code', "plan_{$i}")->value('id') : null;
            $plans[] = $planId;
        }

        $genres = [];
        $genreNames = ['Lịch sử', 'Viễn tưởng', 'Tình cảm', 'Hành động', 'Kinh dị', 'Hài', 'Phiêu lưu', 'Gia đình', 'Trinh thám', 'Cổ tích'];
        foreach ($genreNames as $i => $name) {
            DB::table('genres')->updateOrInsert(
                ['code' => "genre_{$i}"],
                ['name' => $name, 'description' => "Thể loại {$name}", 'is_active' => true, 'created_at' => $now, 'updated_at' => $now]
            );
            $genres[] = DB::table('genres')->where('code', "genre_{$i}")->value('id');
        }

        $visualStyles = [];
        $styleNames = ['Điện ảnh', 'Anime', 'Tranh vẽ', 'Đồ họa 3D', 'Màu nước', 'Hoạt hình', 'Chụp chân dung', 'Cyberpunk', 'Cổ điển', 'Tối giản'];
        foreach ($styleNames as $i => $name) {
            DB::table('visual_styles')->updateOrInsert(
                ['code' => "style_{$i}"],
                ['name' => $name, 'description' => "Phong cách {$name}", 'preview_image_url' => null, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now]
            );
            $visualStyles[] = DB::table('visual_styles')->where('code', "style_{$i}")->value('id');
        }

        for ($i = 0; $i < 10; $i++) {
            DB::table('context_presets')->updateOrInsert(
                ['code' => "context_{$i}"],
                [
                    'name' => "Bối cảnh {$i}",
                    'era' => ['Hiện đại', 'Trung cổ', 'Tương lai'][$i % 3],
                    'location' => ['Hà Nội', 'Đà Lạt', 'Huế', 'Sài Gòn'][$i % 4],
                    'people_description' => 'Người dân địa phương',
                    'costume_description' => 'Trang phục phù hợp bối cảnh',
                    'architecture_description' => 'Kiến trúc đặc trưng',
                    'signage_text' => null,
                    'life_details' => 'Sinh hoạt đời thường',
                    'negative_prompt' => 'biến dạng, mờ, nhiễu',
                    'is_active' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]
            );
        }

        // Users and one-to-one wallets
        $users = [];
        $wallets = [];
        for ($i = 1; $i <= 10; $i++) {
            $user = User::withTrashed()->updateOrCreate(
                ['email' => "seed{$i}@example.com"],
                [
                    'name' => "Người dùng {$i}",
                    'password' => Hash::make('password'),
                    'role' => $i === 1 ? 'admin' : 'user',
                    'email_verified_at' => $now,
                ]
            );
            $users[] = $user->id;
            DB::table('credit_wallets')->updateOrInsert(
                ['user_id' => $user->id],
                ['balance_available' => 1000 + $i * 100, 'balance_held' => 0, 'created_at' => $now, 'updated_at' => $now]
            );
            $wallets[] = DB::table('credit_wallets')->where('user_id', $user->id)->value('id');
        }

        // Orders and subscriptions
        for ($i = 0; $i < 10; $i++) {
            DB::table('orders')->updateOrInsert(
                ['order_code' => 'ORD-SEED-'.str_pad((string) ($i + 1), 3, '0', STR_PAD_LEFT)],
                [
                    'user_id' => $users[$i], 'plan_id' => $plans[$i],
                    'amount_vnd' => 100000 * ($i + 1), 'received_amount' => 100000 * ($i + 1),
                    'payment_method' => 'vietqr', 'status' => 'paid', 'expires_at' => $now,
                    'paid_at' => $now, 'bank_transaction_id' => 'BANK-SEED-'.($i + 1),
                    'created_at' => $now,
                ]
            );
            $orderId = DB::table('orders')->where('order_code', 'ORD-SEED-'.str_pad((string) ($i + 1), 3, '0', STR_PAD_LEFT))->value('id');
            $plan = (array) DB::table('plans')->where('id', $plans[$i])->first();
            DB::table('subscriptions')->updateOrInsert(
                ['order_id' => $orderId],
                [
                    'user_id' => $users[$i], 'plan_id' => $plans[$i], 'status' => 'active',
                    'starts_at' => $now, 'expires_at' => $now->copy()->addDays(30),
                    'monthly_credits' => $plan['monthly_credits'], 'max_projects' => $plan['max_projects'],
                    'max_words_per_project' => $plan['max_words_per_project'],
                    'daily_text_limit' => $plan['daily_text_limit'],
                    'daily_standard_image_limit' => $plan['daily_standard_image_limit'],
                    'daily_premium_image_limit' => $plan['daily_premium_image_limit'],
                    'monthly_tts_char_limit' => $plan['monthly_tts_char_limit'], 'created_at' => $now,
                ]
            );
        }

        // Credit lots
        $lots = [];
        for ($i = 0; $i < 10; $i++) {
            DB::table('credit_lots')->updateOrInsert(
                ['grant_key' => "seed-grant-{$i}"],
                [
                    'wallet_id' => $wallets[$i], 'source_type' => 'subscription', 'source_id' => $i + 1,
                    'initial_amount' => 1000, 'remaining_amount' => 800,
                    'held_amount' => 100, 'consumed_amount' => 100, 'expired_amount' => 0,
                    'expires_at' => $now->copy()->addDays(30), 'status' => 'active', 'created_at' => $now,
                ]
            );
            $lots[] = DB::table('credit_lots')->where('grant_key', "seed-grant-{$i}")->value('id');
        }

        // AI catalog and prices (provider/model tables currently contain only timestamps)
        $providers = [];
        $models = [];
        $prices = [];
        for ($i = 1; $i <= 10; $i++) {
            DB::table('ai_providers')->insertOrIgnore(['created_at' => $now, 'updated_at' => $now]);
            $providerId = DB::table('ai_providers')->orderByDesc('id')->value('id');
            $providers[] = $providerId;

            DB::table('ai_models')->insertOrIgnore(['created_at' => $now, 'updated_at' => $now]);
            $modelId = DB::table('ai_models')->orderByDesc('id')->value('id');
            $models[] = $modelId;

            DB::table('ai_model_prices')->updateOrInsert(
                ['model_id' => $modelId, 'variant_code' => "seed_v{$i}"],
                [
                    'unit_type' => $i % 2 ? 'request' : 'image', 'credit_cost' => 10 * $i,
                    'is_active' => true, 'quota_category' => $i % 2 ? 'text' : 'image_standard', 'created_at' => $now,
                ]
            );
            $prices[] = DB::table('ai_model_prices')->where('model_id', $modelId)->where('variant_code', "seed_v{$i}")->value('id');
        }

        // Projects
        $projects = [];
        for ($i = 0; $i < 10; $i++) {
            DB::table('projects')->updateOrInsert(
                ['user_id' => $users[$i], 'title' => "Dự án điện ảnh {$i}"],
                [
                    'genre_id' => $genres[$i], 'visual_style_id' => $visualStyles[$i],
                    'aspect_ratio' => ['16:9', '9:16', '1:1'][$i % 3],
                    'original_story_text' => "Câu chuyện mẫu số {$i} diễn ra tại Việt Nam.",
                    'status' => 'draft', 'created_at' => $now, 'updated_at' => $now,
                ]
            );
            $projects[] = DB::table('projects')->where('user_id', $users[$i])->where('title', "Dự án điện ảnh {$i}")->value('id');
        }

        // AI generation requests
        $requests = [];
        for ($i = 0; $i < 10; $i++) {
            DB::table('ai_generation_requests')->updateOrInsert(
                ['idempotency_key' => "seed-request-{$i}"],
                [
                    'user_id' => $users[$i], 'wallet_id' => $wallets[$i], 'project_id' => $projects[$i],
                    'price_id' => $prices[$i], 'prompt' => "Tạo cảnh quay có bối cảnh Việt Nam số {$i}",
                    'credits_amount' => 10 * ($i + 1), 'units_count' => 1,
                    'status' => 'completed', 'provider_task_id' => "task-seed-{$i}",
                    'error_message' => null, 'completed_at' => $now, 'created_at' => $now,
                ]
            );
            $requests[] = DB::table('ai_generation_requests')->where('idempotency_key', "seed-request-{$i}")->value('id');
        }

        // Credit holds and ledger entries
        $holds = [];
        for ($i = 0; $i < 10; $i++) {
            DB::table('credit_holds')->updateOrInsert(
                ['idempotency_key' => "seed-hold-{$i}"],
                [
                    'wallet_id' => $wallets[$i], 'generation_request_id' => $requests[$i],
                    'amount' => 100, 'consumed_amount' => 100, 'status' => 'consumed',
                    'expires_at' => $now->copy()->addHour(), 'settled_at' => $now, 'created_at' => $now,
                ]
            );
            $holds[] = DB::table('credit_holds')->where('idempotency_key', "seed-hold-{$i}")->value('id');

            DB::table('credit_ledger_entries')->updateOrInsert(
                ['idempotency_key' => "seed-ledger-{$i}"],
                [
                    'wallet_id' => $wallets[$i], 'entry_type' => 'consume',
                    'available_delta' => -100, 'held_delta' => -100,
                    'available_after' => 900, 'held_after' => 0,
                    'lot_id' => $lots[$i], 'hold_id' => $holds[$i], 'created_at' => $now,
                ]
            );
        }

        // Chapters, events and characters
        $chapters = [];
        $events = [];
        $characters = [];
        for ($i = 0; $i < 10; $i++) {
            DB::table('chapters')->updateOrInsert(
                ['project_id' => $projects[$i], 'chapter_number' => 1],
                ['title' => 'Chương 1', 'content_text' => "Nội dung chương mẫu {$i}", 'created_at' => $now, 'updated_at' => $now]
            );
            $chapters[] = DB::table('chapters')->where('project_id', $projects[$i])->value('id');

            DB::table('events')->updateOrInsert(
                ['project_id' => $projects[$i], 'event_order' => 1],
                ['chapter_id' => $chapters[$i], 'summary' => "Sự kiện mở đầu {$i}", 'created_at' => $now, 'updated_at' => $now]
            );
            $events[] = DB::table('events')->where('project_id', $projects[$i])->value('id');

            DB::table('characters')->updateOrInsert(
                ['project_id' => $projects[$i], 'name' => "Nhân vật {$i}"],
                ['role_type' => 'Nhân vật chính', 'description' => "Nhân vật đóng vai trò quan trọng tại cảnh {$i}", 'default_voice_id' => null, 'created_at' => $now, 'updated_at' => $now]
            );
            $characters[] = DB::table('characters')->where('project_id', $projects[$i])->value('id');
        }

        // Providers/voices
        $voices = [];
        for ($i = 0; $i < 10; $i++) {
            DB::table('voices')->updateOrInsert(
                ['provider_id' => $providers[$i], 'voice_code' => "voice_vi_{$i}"],
                ['display_name' => "Giọng Việt {$i}", 'language' => 'vi', 'is_active' => true, 'created_at' => $now]
            );
            $voices[] = DB::table('voices')->where('provider_id', $providers[$i])->value('id');
        }

        // Scripts, dialogues, storyboard shots and outputs
        for ($i = 0; $i < 10; $i++) {
            DB::table('scripts')->updateOrInsert(
                ['project_id' => $projects[$i], 'scene_number' => 1],
                ['event_id' => $events[$i], 'scene_heading' => "INT. CẢNH {$i}", 'action_description' => "Nhân vật bước vào khung cảnh {$i}", 'created_at' => $now, 'updated_at' => $now]
            );
            $scriptId = DB::table('scripts')->where('project_id', $projects[$i])->where('scene_number', 1)->value('id');

            DB::table('script_dialogues')->updateOrInsert(
                ['script_id' => $scriptId, 'line_order' => 1],
                ['character_id' => $characters[$i], 'dialogue_text' => "Lời thoại mẫu số {$i}", 'created_at' => $now, 'updated_at' => $now]
            );
            $dialogueId = DB::table('script_dialogues')->where('script_id', $scriptId)->where('line_order', 1)->value('id');

            DB::table('storyboard_shots')->updateOrInsert(
                ['script_id' => $scriptId, 'shot_number' => 1],
                ['shot_type' => 'medium', 'ai_image_prompt' => "Cảnh quay điện ảnh số {$i}", 'image_path' => null, 'generation_status' => 'completed', 'generation_request_id' => $requests[$i], 'created_at' => $now, 'updated_at' => $now]
            );
            $shotId = DB::table('storyboard_shots')->where('script_id', $scriptId)->where('shot_number', 1)->value('id');

            DB::table('voiceovers')->updateOrInsert(
                ['dialogue_id' => $dialogueId, 'voice_id' => $voices[$i]],
                ['spoken_text' => "Lời thoại đã tối ưu TTS số {$i}", 'audio_path' => "audio/seed_{$i}.mp3", 'duration_seconds' => 3.5, 'status' => 'completed', 'generation_request_id' => $requests[$i], 'created_at' => $now, 'updated_at' => $now]
            );

            DB::table('videos')->updateOrInsert(
                ['shot_id' => $shotId],
                ['video_prompt' => "Video cảnh quay số {$i}", 'video_path' => "videos/seed_{$i}.mp4", 'duration_seconds' => 5, 'status' => 'completed', 'generation_request_id' => $requests[$i], 'created_at' => $now, 'updated_at' => $now]
            );

            DB::table('event_characters')->updateOrInsert(
                ['event_id' => $events[$i], 'character_id' => $characters[$i]],
                []
            );
        }

        // Auth support records
        for ($i = 0; $i < 10; $i++) {
            DB::table('refresh_tokens')->updateOrInsert(
                ['token_hash' => hash('sha256', "seed-refresh-token-{$i}")],
                [
                    'user_id' => $users[$i], 'family_id' => Str::uuid()->toString(),
                    'user_agent' => 'Laravel Seeder', 'ip_address' => '127.0.0.1',
                    'expires_at' => $now->copy()->addDays(30), 'used_at' => null, 'revoked_at' => null, 'created_at' => $now,
                ]
            );
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => "seed{$i}@example.com"],
                ['token' => hash('sha256', "seed-reset-{$i}"), 'created_at' => $now]
            );
        }

        $this->call([
            UserDailyUsageSeeder::class,
            ProjectContextSeeder::class,
        ]);
    }
}
