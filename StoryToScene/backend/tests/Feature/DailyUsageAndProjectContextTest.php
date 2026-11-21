<?php

namespace Tests\Feature;

use App\Models\ContextPreset;
use App\Models\Project;
use App\Models\ProjectContext;
use App\Models\User;
use App\Models\UserDailyUsage;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DailyUsageAndProjectContextTest extends TestCase
{
    use RefreshDatabase;

    public function test_daily_usage_relationships_unique_key_and_user_foreign_key(): void
    {
        $this->seed();

        $user = User::query()->where('email', 'seed1@example.com')->firstOrFail();
        $usage = $user->dailyUsages()->firstOrFail();

        $this->assertSame($user->id, $usage->user->id);
        $this->assertSame('date', $usage->getCasts()['usage_date']);
        $this->assertSame('integer', $usage->getCasts()['text_count']);

        try {
            UserDailyUsage::create([
                'user_id' => $user->id,
                'usage_date' => $usage->usage_date,
                'text_count' => 1,
                'standard_image_count' => 0,
                'premium_image_count' => 0,
                'tts_char_count' => 0,
            ]);
            $this->fail('A duplicate user/date record should violate the unique constraint.');
        } catch (QueryException) {
            $this->assertDatabaseCount('user_daily_usages', 10);
        }

        try {
            UserDailyUsage::create([
                'user_id' => 999999,
                'usage_date' => today()->toDateString(),
                'text_count' => 0,
                'standard_image_count' => 0,
                'premium_image_count' => 0,
                'tts_char_count' => 0,
            ]);
            $this->fail('A nonexistent user should violate the foreign key.');
        } catch (QueryException) {
            $this->assertDatabaseCount('user_daily_usages', 10);
        }
    }

    public function test_deleting_a_user_cascades_to_daily_usage(): void
    {
        $user = User::factory()->create();
        $usage = UserDailyUsage::create([
            'user_id' => $user->id,
            'usage_date' => today()->toDateString(),
            'text_count' => 4,
            'standard_image_count' => 1,
            'premium_image_count' => 0,
            'tts_char_count' => 500,
        ]);

        $user->forceDelete();

        $this->assertDatabaseMissing('user_daily_usages', ['id' => $usage->id]);
    }

    public function test_project_context_relationships_and_project_unique_key(): void
    {
        $this->seed();

        $context = ProjectContext::query()->firstOrFail();
        $this->assertSame($context->id, $context->project->projectContext->id);
        $this->assertSame($context->id, $context->contextPreset->projectContexts->first()->id);

        try {
            ProjectContext::create([
                'project_id' => $context->project_id,
                'context_preset_id' => $context->context_preset_id,
                'style_name_snapshot' => $context->style_name_snapshot,
                'genre_name_snapshot' => $context->genre_name_snapshot,
            ]);
            $this->fail('A project should not have a second context record.');
        } catch (QueryException) {
            $this->assertDatabaseCount('project_contexts', 10);
        }

        try {
            ProjectContext::create([
                'project_id' => 999999,
                'style_name_snapshot' => 'Không tồn tại',
                'genre_name_snapshot' => 'Không tồn tại',
            ]);
            $this->fail('A nonexistent project should violate the foreign key.');
        } catch (QueryException) {
            $this->assertDatabaseCount('project_contexts', 10);
        }
    }

    public function test_deleting_a_preset_sets_null_and_deleting_a_project_cascades(): void
    {
        $this->seed();

        $context = ProjectContext::query()->firstOrFail();
        $presetId = $context->context_preset_id;
        ContextPreset::query()->findOrFail($presetId)->delete();
        $this->assertDatabaseHas('project_contexts', [
            'id' => $context->id,
            'context_preset_id' => null,
        ]);

        $source = Project::query()->with(['genre', 'visualStyle'])->firstOrFail();
        $project = Project::create([
            'user_id' => $source->user_id,
            'title' => 'Dự án kiểm tra cascade',
            'genre_id' => $source->genre_id,
            'visual_style_id' => $source->visual_style_id,
            'aspect_ratio' => '16:9',
            'status' => 'draft',
        ]);
        $projectContext = ProjectContext::create([
            'project_id' => $project->id,
            'style_name_snapshot' => $source->visualStyle->name,
            'genre_name_snapshot' => $source->genre->name,
        ]);

        $project->forceDelete();

        $this->assertDatabaseMissing('project_contexts', ['id' => $projectContext->id]);
    }
}
