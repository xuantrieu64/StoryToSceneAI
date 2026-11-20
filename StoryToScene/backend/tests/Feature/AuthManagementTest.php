<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\UserService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PragmaRX\Google2FALaravel\Facade as Google2FA;
use Tests\TestCase;

class AuthManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_creates_a_user_wallet_and_access_token(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Test User',
            'email' => 'auth@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.user.two_factor_enabled', false)
            ->assertJsonPath('data.user.wallet.balance_available', 0)
            ->assertJsonPath('data.user.wallet.balance_held', 0)
            ->assertJsonPath('data.token_type', 'Bearer');

        $this->assertDatabaseHas('users', ['email' => 'auth@example.com']);
        $this->assertDatabaseHas('credit_wallets', [
            'user_id' => User::where('email', 'auth@example.com')->value('id'),
            'balance_available' => 0,
            'balance_held' => 0,
        ]);
        $this->assertDatabaseHas('personal_access_tokens', [
            'name' => 'auth_token',
        ]);
    }

    public function test_logout_handles_a_user_without_a_current_access_token(): void
    {
        $this->expectNotToPerformAssertions();

        app(UserService::class)->logout(new User);
    }

    public function test_wallet_backfill_creates_a_zero_balance_wallet_for_existing_users(): void
    {
        $user = User::factory()->create();
        $migration = require database_path('migrations/2026_11_20_070001_backfill_credit_wallets.php');

        $migration->up();

        $this->assertDatabaseHas('credit_wallets', [
            'user_id' => $user->id,
            'balance_available' => 0,
            'balance_held' => 0,
        ]);
    }

    public function test_two_factor_is_only_enabled_after_a_valid_otp_and_secret_is_encrypted(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('auth_test')->plainTextToken;

        $setup = $this->withToken($token)->postJson('/api/v1/auth/2fa/enable');
        $setup->assertOk();

        $secret = $setup->json('data.secret');
        $this->assertIsString($secret);
        $this->assertNotSame(
            $secret,
            DB::table('users')->where('id', $user->id)->value('two_factor_secret')
        );
        $this->assertFalse($user->fresh()->hasTwoFactorEnabled());

        $this->postJson('/api/v1/auth/2fa/verify', [
            'code' => Google2FA::getCurrentOtp($secret),
        ])->assertOk();

        $this->assertTrue($user->fresh()->hasTwoFactorEnabled());
        $this->getJson('/api/v1/auth/me')->assertJsonPath('data.two_factor_enabled', true)
            ->assertJsonMissingPath('data.two_factor_secret');

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertStatus(202);

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password',
            'two_factor_code' => Google2FA::getCurrentOtp($secret),
        ])->assertOk()
            ->assertJsonPath('status', 'success');

        $this->postJson('/api/v1/auth/2fa/disable')->assertOk();
        $this->assertFalse($user->fresh()->hasTwoFactorEnabled());
    }
}
