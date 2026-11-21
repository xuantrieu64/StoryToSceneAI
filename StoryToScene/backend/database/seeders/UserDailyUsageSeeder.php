<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\UserDailyUsage;
use Illuminate\Database\Seeder;
use RuntimeException;

class UserDailyUsageSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::query()->orderBy('id')->limit(10)->get();

        if ($users->count() < 10) {
            throw new RuntimeException('UserDailyUsageSeeder requires at least 10 existing users.');
        }

        foreach ($users as $index => $user) {
            UserDailyUsage::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'usage_date' => today()->toDateString(),
                ],
                [
                    'text_count' => 3 + $index * 2,
                    'standard_image_count' => $index % 7,
                    'premium_image_count' => $index % 4,
                    'tts_char_count' => 250 + $index * 175,
                ]
            );
        }
    }
}
