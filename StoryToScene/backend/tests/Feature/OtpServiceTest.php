<?php

namespace Tests\Feature;

use App\Jobs\SendOtpMailJob;
use App\Mail\OtpMail;
use App\Models\EmailOtp;
use App\Services\Auth\AuthException;
use App\Services\Auth\OtpService;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class OtpServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_send_queues_a_six_digit_otp_and_persists_only_its_hmac(): void
    {
        Queue::fake();

        app(OtpService::class)->send(' OTP@example.com ', OtpService::PURPOSE_REGISTER);

        $job = Queue::pushed(SendOtpMailJob::class)->first();
        $stored = DB::table('email_otps')->first();

        $this->assertInstanceOf(ShouldBeEncrypted::class, $job);
        $this->assertSame(3, $job->tries);
        $this->assertSame([10, 60, 180], $job->backoff);
        $this->assertMatchesRegularExpression('/^\d{6}$/', $job->otp);
        $this->assertSame('otp@example.com', $stored->email);
        $this->assertSame(
            hash_hmac('sha256', $job->otp, (string) config('app.key')),
            $stored->otp_hash,
        );
        $this->assertNotSame($job->otp, $stored->otp_hash);
        $this->assertSame(OtpService::PURPOSE_REGISTER, $stored->purpose);
    }

    public function test_send_enforces_cooldown_and_hourly_limit(): void
    {
        Queue::fake();
        $service = app(OtpService::class);
        $service->send('cooldown@example.com', OtpService::PURPOSE_REGISTER);

        try {
            $service->send('cooldown@example.com', OtpService::PURPOSE_REGISTER);
            $this->fail('The resend cooldown should reject an immediate resend.');
        } catch (AuthException $exception) {
            $this->assertSame('otp_throttled', $exception->errorCode);
            $this->assertSame(429, $exception->statusCode);
        }

        $this->travel(61)->seconds();
        $service->send('hourly@example.com', OtpService::PURPOSE_REGISTER);

        for ($send = 2; $send <= 5; $send++) {
            $this->travel(61)->seconds();
            $service->send('hourly@example.com', OtpService::PURPOSE_REGISTER);
        }

        $this->travel(61)->seconds();

        try {
            $service->send('hourly@example.com', OtpService::PURPOSE_REGISTER);
            $this->fail('The hourly send limit should reject the sixth OTP.');
        } catch (AuthException $exception) {
            $this->assertSame('otp_throttled', $exception->errorCode);
        }

        $this->assertSame(5, RateLimiter::attempts(
            'otp-send:hourly@example.com:'.OtpService::PURPOSE_REGISTER,
        ));
        $this->assertSame(1, DB::table('email_otps')->where('email', 'hourly@example.com')->count());
    }

    public function test_otp_lifetime_depends_on_its_purpose(): void
    {
        Queue::fake();
        $service = app(OtpService::class);
        $service->send('register@example.com', OtpService::PURPOSE_REGISTER);
        $service->send('login@example.com', OtpService::PURPOSE_LOGIN_2FA);

        $register = DB::table('email_otps')->where('email', 'register@example.com')->first();
        $login = DB::table('email_otps')->where('email', 'login@example.com')->first();

        $this->assertSame(
            600,
            Carbon::parse($register->expires_at)->getTimestamp()
                - Carbon::parse($register->created_at)->getTimestamp(),
        );
        $this->assertSame(
            300,
            Carbon::parse($login->expires_at)->getTimestamp()
                - Carbon::parse($login->created_at)->getTimestamp(),
        );
    }

    public function test_verify_accepts_a_valid_otp_once_and_counts_wrong_attempts(): void
    {
        Queue::fake();
        $service = app(OtpService::class);
        $service->send('verify@example.com', OtpService::PURPOSE_REGISTER);
        $otp = Queue::pushed(SendOtpMailJob::class)->first()->otp;

        $this->assertFalse($service->verify('verify@example.com', OtpService::PURPOSE_REGISTER, $otp === '000000' ? '000001' : '000000'));
        $this->assertSame(1, DB::table('email_otps')->value('attempts'));
        $this->assertTrue($service->verify('verify@example.com', OtpService::PURPOSE_REGISTER, $otp));
        $this->assertFalse($service->verify('verify@example.com', OtpService::PURPOSE_REGISTER, $otp));
        $this->assertNotNull(DB::table('email_otps')->value('consumed_at'));
    }

    public function test_expired_and_five_attempt_otps_are_rejected(): void
    {
        Queue::fake();
        $service = app(OtpService::class);

        $service->send('expired@example.com', OtpService::PURPOSE_REGISTER);
        DB::table('email_otps')->where('email', 'expired@example.com')->update(['expires_at' => now()->subSecond()]);
        $this->assertFalse($service->verify('expired@example.com', OtpService::PURPOSE_REGISTER, '123456'));

        $service->send('attempts@example.com', OtpService::PURPOSE_REGISTER);
        $otp = Queue::pushed(SendOtpMailJob::class)->last()->otp;

        for ($attempt = 0; $attempt < 5; $attempt++) {
            $service->verify('attempts@example.com', OtpService::PURPOSE_REGISTER, $otp === '000000' ? '000001' : '000000');
        }

        $this->assertSame(5, DB::table('email_otps')->where('email', 'attempts@example.com')->value('attempts'));
        $this->assertFalse($service->verify('attempts@example.com', OtpService::PURPOSE_REGISTER, $otp));
    }

    public function test_more_than_ten_wrong_codes_in_thirty_minutes_are_throttled(): void
    {
        Queue::fake();
        $service = app(OtpService::class);
        $wrongAttempts = 0;
        $wasThrottled = false;

        for ($batch = 0; $batch < 3; $batch++) {
            if ($batch > 0) {
                $this->travel(61)->seconds();
            }

            $service->send('fail-limit@example.com', OtpService::PURPOSE_REGISTER);
            $otp = Queue::pushed(SendOtpMailJob::class)->last()->otp;
            $wrongCode = $otp === '000000' ? '000001' : '000000';
            $attemptsThisOtp = $batch < 2 ? 4 : 3;

            for ($attempt = 0; $attempt < $attemptsThisOtp; $attempt++) {
                try {
                    $this->assertFalse($service->verify(
                        'fail-limit@example.com',
                        OtpService::PURPOSE_REGISTER,
                        $wrongCode,
                    ));
                    $wrongAttempts++;
                } catch (AuthException $exception) {
                    $this->assertSame('otp_throttled', $exception->errorCode);
                    $this->assertSame(429, $exception->statusCode);
                    $wasThrottled = true;
                    break 2;
                }
            }
        }

        $this->assertSame(10, $wrongAttempts);
        $this->assertTrue($wasThrottled);
    }

    public function test_otp_cannot_be_verified_for_a_different_purpose(): void
    {
        Queue::fake();
        $service = app(OtpService::class);
        $service->send('purpose@example.com', OtpService::PURPOSE_LOGIN_2FA);
        $otp = Queue::pushed(SendOtpMailJob::class)->first()->otp;

        $this->assertFalse($service->verify('purpose@example.com', OtpService::PURPOSE_REGISTER, $otp));
        $this->assertTrue($service->verify('purpose@example.com', OtpService::PURPOSE_LOGIN_2FA, $otp));
    }

    public function test_pruning_only_selects_otps_expired_for_more_than_one_day(): void
    {
        EmailOtp::query()->create([
            'email' => 'old@example.com',
            'purpose' => OtpService::PURPOSE_REGISTER,
            'otp_hash' => str_repeat('a', 64),
            'expires_at' => now()->subDays(2),
            'last_sent_at' => now()->subDays(2)->subMinutes(10),
        ]);
        EmailOtp::query()->create([
            'email' => 'recent@example.com',
            'purpose' => OtpService::PURPOSE_REGISTER,
            'otp_hash' => str_repeat('b', 64),
            'expires_at' => now()->subHours(12),
            'last_sent_at' => now()->subHours(12)->subMinutes(10),
        ]);

        $this->assertSame(
            ['old@example.com'],
            (new EmailOtp)->prunable()->orderBy('email')->pluck('email')->all(),
        );
    }

    public function test_otp_mail_contains_the_localized_purpose_and_safety_instruction(): void
    {
        Mail::fake();

        (new SendOtpMailJob('mail@example.com', '012345', OtpService::PURPOSE_ENABLE_2FA, now()->addMinutes(10)->toIso8601String()))
            ->handle();

        Mail::assertSent(OtpMail::class, function (OtpMail $mail): bool {
            $content = $mail->render();

            return $mail->purpose === OtpService::PURPOSE_ENABLE_2FA
                && $mail->otp === '012345'
                && str_contains($content, '012345')
                && str_contains($content, 'bật xác thực hai lớp')
                && str_contains($content, 'Mã có hiệu lực đến')
                && str_contains($content, 'Nếu bạn không thực hiện, hãy bỏ qua và đổi mật khẩu');
        });
    }
}
