<?php

namespace Database\Seeders;

use App\Models\ContextPreset;
use App\Models\Project;
use App\Models\ProjectContext;
use Illuminate\Database\Seeder;
use RuntimeException;

class ProjectContextSeeder extends Seeder
{
    public function run(): void
    {
        $projects = Project::query()
            ->with(['genre', 'visualStyle'])
            ->orderBy('id')
            ->limit(10)
            ->get();

        if ($projects->count() < 10) {
            throw new RuntimeException('ProjectContextSeeder requires at least 10 existing projects.');
        }

        $presets = ContextPreset::query()->orderBy('id')->get()->values();

        foreach ($projects as $index => $project) {
            if ($project->genre === null || $project->visualStyle === null) {
                throw new RuntimeException(
                    "ProjectContextSeeder requires a genre and visual style for project {$project->id}."
                );
            }

            $preset = $presets->isEmpty() ? null : $presets[$index % $presets->count()];

            ProjectContext::updateOrCreate(
                ['project_id' => $project->id],
                [
                    'context_preset_id' => $preset?->id,
                    'style_name_snapshot' => $project->visualStyle->name,
                    'style_description_snapshot' => $project->visualStyle->description,
                    'genre_name_snapshot' => $project->genre->name,
                    'genre_description_snapshot' => $project->genre->description,
                    'era' => $preset?->era,
                    'location' => $preset?->location,
                    'people_description' => $preset?->people_description,
                    'costume_description' => $preset?->costume_description,
                    'architecture_description' => $preset?->architecture_description,
                    'sign_language_text' => $preset?->signage_text,
                    'life_details' => $preset?->life_details,
                    'negative_prompt' => $preset?->negative_prompt,
                ]
            );
        }
    }
}
