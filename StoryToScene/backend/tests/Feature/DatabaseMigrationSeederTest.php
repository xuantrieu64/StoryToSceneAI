<?php

namespace Tests\Feature;

use App\Models\Character;
use App\Models\Event;
use App\Models\Order;
use App\Models\Project;
use App\Models\Script;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DatabaseMigrationSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_migrations_and_full_seeder_run(): void
    {
        Artisan::call('db:seed', ['--force' => true]);

        $expectedCounts = [
            'users' => 10,
            'plans' => 10,
            'orders' => 10,
            'subscriptions' => 10,
            'credit_wallets' => 10,
            'credit_lots' => 10,
            'credit_holds' => 10,
            'credit_ledger_entries' => 10,
            'genres' => 10,
            'visual_styles' => 10,
            'context_presets' => 10,
            'projects' => 10,
            'project_contexts' => 10,
            'ai_providers' => 10,
            'ai_models' => 10,
            'ai_model_prices' => 10,
            'ai_generation_requests' => 10,
            'chapters' => 10,
            'events' => 10,
            'characters' => 10,
            'voices' => 10,
            'scripts' => 10,
            'script_dialogues' => 10,
            'storyboard_shots' => 10,
            'voiceovers' => 10,
            'videos' => 10,
            'refresh_tokens' => 10,
            'password_reset_tokens' => 10,
            'event_characters' => 10,
        ];

        foreach ($expectedCounts as $table => $count) {
            $this->assertGreaterThanOrEqual(
                $count,
                DB::table($table)->count(),
                "Table {$table} has insufficient seeded records"
            );
        }
    }

    public function test_model_relationships_resolve_real_seeded_records(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'seed1@example.com')->firstOrFail();
        $this->assertNotNull($user->creditWallet);
        $this->assertGreaterThanOrEqual(1, $user->orders()->count());
        $this->assertGreaterThanOrEqual(1, $user->projects()->count());

        $project = Project::query()->where('user_id', $user->id)->firstOrFail();
        $this->assertSame($user->id, $project->user->id);
        $this->assertGreaterThanOrEqual(1, $project->chapters()->count());
        $this->assertGreaterThanOrEqual(1, $project->events()->count());
        $this->assertGreaterThanOrEqual(1, $project->characters()->count());

        $script = Script::query()->firstOrFail();
        $this->assertNotNull($script->project);
        $this->assertGreaterThanOrEqual(1, $script->dialogues()->count());
        $this->assertGreaterThanOrEqual(1, $script->shots()->count());

        $event = Event::query()->firstOrFail();
        $this->assertGreaterThanOrEqual(1, $event->characters()->count());

        $character = Character::query()->firstOrFail();
        $this->assertGreaterThanOrEqual(1, $character->events()->count());

        $order = Order::query()->firstOrFail();
        $this->assertNotNull($order->user);
        $this->assertNotNull($order->plan);
    }

    public function test_unique_constraints_reject_duplicate_seed_keys(): void
    {
        $this->seed();

        $existing = DB::table('plans')->first();
        $this->expectException(\Illuminate\Database\QueryException::class);
        DB::table('plans')->insert([
            'code' => $existing->code,
            'name' => 'Trùng mã',
            'price_vnd' => 1,
            'is_purchasable' => true,
            'duration_days' => 30,
            'max_projects' => 1,
            'max_words_per_project' => 100,
            'monthly_credits' => 1,
            'daily_text_limit' => 1,
            'daily_standard_image_limit' => 1,
            'daily_premium_image_limit' => 1,
            'monthly_tts_char_limit' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
