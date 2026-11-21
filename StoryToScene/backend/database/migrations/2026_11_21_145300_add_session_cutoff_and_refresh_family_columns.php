<?php

use Carbon\Carbon;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'sessions_valid_after')) {
                $table->timestamp('sessions_valid_after')->nullable();
            }
        });

        Schema::table('refresh_tokens', function (Blueprint $table): void {
            if (! Schema::hasColumn('refresh_tokens', 'family_expires_at')) {
                $table->timestamp('family_expires_at')->nullable();
            }

            if (! Schema::hasColumn('refresh_tokens', 'replaced_by')) {
                $table->foreignId('replaced_by')
                    ->nullable()
                    ->constrained('refresh_tokens')
                    ->nullOnDelete();
            }
        });

        DB::table('refresh_tokens')
            ->whereNull('family_expires_at')
            ->orderBy('id')
            ->chunkById(500, function ($tokens): void {
                foreach ($tokens as $token) {
                    DB::table('refresh_tokens')
                        ->where('id', $token->id)
                        ->update([
                            'family_expires_at' => Carbon::parse($token->created_at)->addDays(30),
                        ]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('refresh_tokens', function (Blueprint $table): void {
            if (Schema::hasColumn('refresh_tokens', 'replaced_by')) {
                $table->dropConstrainedForeignId('replaced_by');
            }

            if (Schema::hasColumn('refresh_tokens', 'family_expires_at')) {
                $table->dropColumn('family_expires_at');
            }
        });

        Schema::table('users', function (Blueprint $table): void {
            if (Schema::hasColumn('users', 'sessions_valid_after')) {
                $table->dropColumn('sessions_valid_after');
            }
        });
    }
};
