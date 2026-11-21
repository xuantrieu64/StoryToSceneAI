<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('project_contexts', 'project_id')) {
            return;
        }

        if (DB::table('project_contexts')->exists()) {
            throw new RuntimeException(
                'Cannot expand project_contexts: existing rows have no project or snapshot information to migrate.'
            );
        }

        Schema::table('project_contexts', function (Blueprint $table) {
            $table->foreignId('project_id')->unique()->constrained('projects')->cascadeOnDelete();
            $table->foreignId('context_preset_id')->nullable()->constrained('context_presets')->nullOnDelete();
            $table->string('style_name_snapshot');
            $table->text('style_description_snapshot')->nullable();
            $table->string('genre_name_snapshot');
            $table->text('genre_description_snapshot')->nullable();
            $table->string('era')->nullable();
            $table->string('location')->nullable();
            $table->text('people_description')->nullable();
            $table->text('costume_description')->nullable();
            $table->text('architecture_description')->nullable();
            $table->string('sign_language_text')->nullable();
            $table->text('life_details')->nullable();
            $table->text('negative_prompt')->nullable();
        });

        DB::table('project_contexts')->whereNull('created_at')->update(['created_at' => now()]);
        DB::table('project_contexts')->whereNull('updated_at')->update(['updated_at' => now()]);

        Schema::table('project_contexts', function (Blueprint $table) {
            $table->timestamp('created_at')->useCurrent()->change();
            $table->timestamp('updated_at')->useCurrent()->change();
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('project_contexts', 'project_id')) {
            return;
        }

        Schema::table('project_contexts', function (Blueprint $table) {
            $table->dropForeign(['project_id']);
            $table->dropForeign(['context_preset_id']);
            $table->dropUnique(['project_id']);
            $table->dropColumn([
                'project_id',
                'context_preset_id',
                'style_name_snapshot',
                'style_description_snapshot',
                'genre_name_snapshot',
                'genre_description_snapshot',
                'era',
                'location',
                'people_description',
                'costume_description',
                'architecture_description',
                'sign_language_text',
                'life_details',
                'negative_prompt',
            ]);
            $table->timestamp('created_at')->nullable()->change();
            $table->timestamp('updated_at')->nullable()->change();
        });
    }
};
