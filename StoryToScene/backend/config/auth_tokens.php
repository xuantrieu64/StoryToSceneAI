<?php

$accessTtlMinutes = (int) env('AUTH_ACCESS_TTL_MINUTES', 10);
$refreshTtlDays = (int) env('AUTH_REFRESH_TTL_DAYS', 7);
$twoFactorTtlMinutes = (int) env('AUTH_TWO_FACTOR_TTL_MINUTES', 5);
$cookieSecure = env('AUTH_COOKIE_SECURE', env('SESSION_SECURE_COOKIE', false));
$cookieSameSite = env('AUTH_COOKIE_SAME_SITE', env('SESSION_SAME_SITE', 'lax'));
$cookiePath = env('AUTH_COOKIE_PATH', '/api/v1/auth');

return [
    'jwt_secret' => env('JWT_SECRET') ?: env('APP_KEY'),
    'access_ttl_minutes' => $accessTtlMinutes,
    'access_ttl_seconds' => $accessTtlMinutes * 60,
    'refresh_ttl_days' => $refreshTtlDays,
    'refresh_ttl_minutes' => $refreshTtlDays * 1440,
    'family_ttl_days' => (int) env('AUTH_FAMILY_TTL_DAYS', 30),
    'two_factor_ttl_minutes' => $twoFactorTtlMinutes,
    'two_factor_ttl_seconds' => $twoFactorTtlMinutes * 60,
    'cookie_secure' => $cookieSecure,
    'cookie_same_site' => $cookieSameSite,
    'cookie_path' => $cookiePath,
    'refresh_cookie' => [
        'name' => 'refresh_token',
        'path' => $cookiePath,
        'secure' => $cookieSecure,
        'same_site' => $cookieSameSite,
    ],
];
