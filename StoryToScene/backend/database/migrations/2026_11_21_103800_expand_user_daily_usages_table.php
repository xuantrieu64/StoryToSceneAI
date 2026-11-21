<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('user_daily_usages', 'user_id')) {
            return;
        }

        if (DB::table('user_daily_usages')->exists()) {
            throw new RuntimeException(
                'Cannot expand user_daily_usages: existing rows have no user/date information to migrate.'
            );
        }

        Schema::table('user_daily_usages', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('usage_date');
            $table->unsignedInteger('text_count')->default(0);
            $table->unsignedInteger('standard_image_count')->default(0);
            $table->unsignedInteger('premium_image_count')->default(0);
            $table->unsignedInteger('tts_char_count')->default(0);
            $table->unique(['user_id', 'usage_date']);
        });

        DB::table('user_daily_usages')->whereNull('created_at')->update(['created_at' => now()]);
        DB::table('user_daily_usages')->whereNull('updated_at')->update(['updated_at' => now()]);

        Schema::table('user_daily_usages', function (Blueprint $table) {
            $table->timestamp('created_at')->useCurrent()->change();
            $table->timestamp('updated_at')->useCurrent()->change();
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('user_daily_usages', 'user_id')) {
            return;
        }

        Schema::table('user_daily_usages', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropUnique(['user_id', 'usage_date']);
            $table->dropColumn([
                'user_id',
                'usage_date',
                'text_count',
                'standard_image_count',
                'premium_image_count',
                'tts_char_count',
            ]);
            $table->timestamp('created_at')->nullable()->change();
            $table->timestamp('updated_at')->nullable()->change();
        });
    }
};
