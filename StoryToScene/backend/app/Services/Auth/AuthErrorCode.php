<?php

namespace App\Services\Auth;

final class AuthErrorCode
{
    public const INVALID_CREDENTIALS = 'invalid_credentials';

    public const EMAIL_UNVERIFIED = 'email_unverified';

    public const EMAIL_ALREADY_REGISTERED = 'email_already_registered';

    public const OTP_INVALID = 'otp_invalid';

    public const OTP_THROTTLED = 'otp_throttled';

    public const TOKEN_EXPIRED = 'token_expired';

    public const TOKEN_INVALID = 'token_invalid';

    public const TWO_FACTOR_REQUIRED = 'two_factor_required';

    public const TWO_FACTOR_ALREADY_ENABLED = 'two_factor_already_enabled';

    public const TWO_FACTOR_NOT_ENABLED = 'two_factor_not_enabled';

    public const RECENT_AUTHENTICATION_REQUIRED = 'recent_authentication_required';

    public const ACCOUNT_DELETED = 'account_deleted';

    public const TOO_MANY_REQUESTS = 'too_many_requests';

    public const VALIDATION_ERROR = 'validation_error';

    public const ORIGIN_NOT_ALLOWED = 'origin_not_allowed';

    public const CSRF_HEADER_REQUIRED = 'csrf_header_required';
}
