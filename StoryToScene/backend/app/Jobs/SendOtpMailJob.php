<?php

namespace App\Jobs;

use App\Mail\OtpMail;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendOtpMailJob implements ShouldBeEncrypted, ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public array $backoff = [10, 60, 180];

    public function __construct(
        public readonly string $email,
        public readonly string $otp,
        public readonly string $purpose,
        public readonly string $expiresAt,
    ) {}

    public function handle(): void
    {
        Mail::to($this->email)->send(new OtpMail($this->otp, $this->purpose, $this->expiresAt));
    }

    public function failed(?Throwable $exception): void
    {
        Log::warning('Không gửi được email OTP.', ['purpose' => $this->purpose]);
    }
}
