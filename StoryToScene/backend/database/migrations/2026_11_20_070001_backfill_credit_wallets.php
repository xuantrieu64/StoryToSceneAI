<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->whereNotExists(function ($query) {
                $query->selectRaw('1')
                    ->from('credit_wallets')
                    ->whereColumn('credit_wallets.user_id', 'users.id');
            })
            ->orderBy('id')
            ->chunkById(500, function ($users) {
                $now = now();

                DB::table('credit_wallets')->insert(
                    $users->map(fn ($user) => [
                        'user_id' => $user->id,
                        'balance_available' => 0,
                        'balance_held' => 0,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ])->all()
                );
            });
    }

    public function down(): void
    {
        // Existing wallets cannot be distinguished from wallets created by this migration.
    }
};
