<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Services\Auth\TokenService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Cache;

class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'two_factor_enabled_at' => 'datetime',
        'sessions_valid_after' => 'datetime',
        'last_login_at' => 'datetime',
        'password_changed_at' => 'datetime',
        'two_factor_recovery_codes' => 'array',
        'password' => 'hashed',
    ];

    public function creditWallet(): HasOne
    {
        return $this->hasOne(CreditWallet::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function aiGenerationRequests(): HasMany
    {
        return $this->hasMany(AiGenerationRequest::class);
    }

    public function dailyUsages(): HasMany
    {
        return $this->hasMany(UserDailyUsage::class);
    }

    public function refreshTokens(): HasMany
    {
        return $this->hasMany(RefreshToken::class);
    }

    public function emailOtps(): HasMany
    {
        return $this->hasMany(EmailOtp::class);
    }

    public function hasTwoFactorEnabled(): bool
    {
        return ! is_null($this->two_factor_enabled_at);
    }

    protected static function booted(): void
    {
        static::updated(static function (self $user): void {
            if ($user->wasChanged('sessions_valid_after')) {
                Cache::forget(TokenService::sessionsValidAfterCacheKey($user->getKey()));
            }
        });
    }
}
