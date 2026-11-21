<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $otp,
        public readonly string $purpose,
        public readonly string $expiresAt,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Mã xác minh tài khoản StoryToScene');
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.otp',
            with: [
                'otp' => $this->otp,
                'purposeLabel' => match ($this->purpose) {
                    'register' => 'đăng ký tài khoản',
                    'login_2fa' => 'đăng nhập hai lớp',
                    'enable_2fa' => 'bật xác thực hai lớp',
                    'disable_2fa' => 'tắt xác thực hai lớp',
                    'regenerate_codes' => 'tạo lại mã khôi phục',
                    default => 'xác minh tài khoản',
                },
                'expiresAt' => $this->expiresAt,
            ],
        );
    }
}
