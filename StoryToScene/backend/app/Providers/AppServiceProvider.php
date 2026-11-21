<?php

namespace App\Providers;

use Google\Client as GoogleClient;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(GoogleClient::class, static fn (): GoogleClient => new GoogleClient([
            'client_id' => (string) config('services.google.client_id'),
        ]));
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('auth-register', static fn (Request $request) => Limit::perMinute(5)
            ->by((string) $request->ip()));

        RateLimiter::for('auth-verify-email', static fn (Request $request) => Limit::perMinute(10)
            ->by((string) $request->ip().'|'.strtolower((string) $request->input('email'))));

        RateLimiter::for('auth-resend-otp', static fn (Request $request) => Limit::perMinute(3)
            ->by((string) $request->ip().'|'.strtolower((string) $request->input('email'))));

        RateLimiter::for('auth-login', static fn (Request $request) => Limit::perMinute(5)
            ->by(strtolower(trim((string) $request->input('email'))).'|'.(string) $request->ip()));

        RateLimiter::for('auth-google', static fn (Request $request) => Limit::perMinute(5)
            ->by((string) $request->ip()));

        RateLimiter::for('auth-refresh', static fn (Request $request) => Limit::perMinute(10)
            ->by((string) $request->ip()));

        RateLimiter::for('auth-logout', static fn (Request $request) => Limit::perMinute(10)
            ->by((string) $request->ip()));

        RateLimiter::for('auth-me', static fn (Request $request) => Limit::perMinute(60)
            ->by((string) $request->ip()));

        RateLimiter::for('auth-two-factor-verify', static fn (Request $request) => Limit::perMinute(10)
            ->by((string) $request->ip()));

        RateLimiter::for('auth-two-factor-resend', static fn (Request $request) => Limit::perMinute(5)
            ->by((string) $request->ip()));

        RateLimiter::for('auth-two-factor-enable', static fn (Request $request) => Limit::perMinute(5)
            ->by((string) ($request->user()?->getAuthIdentifier() ?? $request->ip())));

        RateLimiter::for('auth-two-factor-disable', static fn (Request $request) => Limit::perMinute(5)
            ->by((string) ($request->user()?->getAuthIdentifier() ?? $request->ip())));

        RateLimiter::for('auth-two-factor-recovery-codes', static fn (Request $request) => Limit::perMinute(5)
            ->by((string) ($request->user()?->getAuthIdentifier() ?? $request->ip())));
    }
}
