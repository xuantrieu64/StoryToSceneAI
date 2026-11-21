<!doctype html>
<html lang="vi">
<head>
    <meta charset="utf-8">
    <title>Mã xác minh</title>
</head>
<body>
    <p>Xin chào,</p>
    <p>Mã này dùng để <strong>{{ $purposeLabel }}</strong>:</p>
    <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px">{{ $otp }}</p>
    <p>Mã có hiệu lực đến {{ $expiresAt }}.</p>
    <p>Nếu bạn không thực hiện, hãy bỏ qua và đổi mật khẩu.</p>
</body>
</html>
