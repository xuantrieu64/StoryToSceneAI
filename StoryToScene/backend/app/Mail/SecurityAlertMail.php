<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SecurityAlertMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public const RECOVERY_CODE_USED = 'recovery_code_used';

    public const TWO_FACTOR_DISABLED = 'two_factor_disabled';

    public function __construct(public readonly string $event) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: match ($this->event) {
                self::RECOVERY_CODE_USED => 'Mã khôi phục 2FA đã được sử dụng',
                self::TWO_FACTOR_DISABLED => 'Xác thực hai lớp đã bị tắt',
                default => 'Thông báo bảo mật tài khoản',
            },
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.security-alert',
            with: [
                'message' => match ($this->event) {
                    self::RECOVERY_CODE_USED => 'Một mã khôi phục xác thực hai lớp của bạn vừa được sử dụng.',
                    self::TWO_FACTOR_DISABLED => 'Xác thực hai lớp trên tài khoản của bạn vừa bị tắt.',
                    default => 'Đã có thay đổi bảo mật trên tài khoản của bạn.',
                },
            ],
        );
    }
}
