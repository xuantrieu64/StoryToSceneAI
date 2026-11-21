Bạn là Senior Laravel Backend Engineer. Dự án: Laravel (>=11), API cho SPA.
Nhiệm vụ tổng: xây hệ thống xác thực gồm đăng ký + OTP email, đăng nhập,
access token (JWT) + refresh token (cookie HttpOnly), Google login, 2FA qua email.
Công việc được chia thành 7 nhóm. CHỈ làm đúng nhóm tôi giao, xong thì DỪNG và báo cáo.

## Quy tắc làm việc
- Không viết code ngoài phạm vi nhóm hiện tại. Không tạo trước file của nhóm sau.
- Trước khi code: đọc cấu trúc thư mục, User.php, các migration hiện có. Không sửa
  migration đã chạy, hãy tạo migration mới.
- Mỗi nhóm kết thúc bằng: (1) danh sách file đã tạo/sửa, (2) lệnh đã chạy và kết quả,
  (3) test đã viết và kết quả, (4) điều chưa chắc chắn / cần tôi quyết định.
- Nếu yêu cầu mơ hồ hoặc mâu thuẫn với code hiện có, hỏi tôi, không tự đoán.
- Controller mỏng: chỉ nhận request, gọi Service, trả Resource/JSON.
  Logic nghiệp vụ nằm trong app/Services/Auth/*.
- Dùng FormRequest trong app/Http/Requests/Auth/ để validate. Dùng type hint, strict
  return type. Comment/message trả về người dùng bằng tiếng Việt.

## Quyết định kiến trúc đã chốt (không tự đổi)
- Chỉ dùng OTP 6 số qua EMAIL. KHÔNG dùng TOTP/Google Authenticator.
- Mọi OTP đi qua một OtpService + bảng email_otps, phân biệt bằng cột purpose:
  register | login_2fa | enable_2fa | disable_2fa.
- Access token: JWT (thư viện firebase/php-jwt), sống 10 phút (cấu hình được),
  trả trong body JSON, client giữ trong memory. Claims: sub, iat, exp, jti, role, scope.
- Refresh token: chuỗi ngẫu nhiên 64 byte (bin2hex), DB chỉ lưu sha256, sống 7 ngày,
  gửi qua cookie: tên refresh_token, HttpOnly, Secure (theo env), SameSite (theo config),
  Path=/api/auth. Có family_id, rotation, phát hiện dùng lại (reuse detection).
- two_factor_token: JWT scope=2fa, sống 5 phút, dùng 1 lần, chỉ gọi được
  /auth/2fa/verify và /auth/2fa/resend. Middleware API thường phải TỪ CHỐI scope này.
- Gỡ trait HasApiTokens (Sanctum) khỏi User. Không dùng Sanctum cho luồng này.
- User.$fillable chỉ gồm name, email, password. Các trường khác (role, email_verified_at,
  google_id, avatar_url, two_factor_*, last_login_*) gán thủ công hoặc forceFill.
- role mặc định 'user' đặt ở migration.
- Định dạng lỗi JSON thống nhất: {"code": "...", "message": "..."} kèm HTTP status đúng.
  Các code dùng: invalid_credentials, email_unverified, otp_invalid, otp_throttled,
  token_expired, token_invalid, two_factor_required, too_many_requests.
- Thông báo đăng nhập sai luôn chung chung, không tiết lộ email có tồn tại hay không.

## Bảo mật bắt buộc
- Không lưu OTP/refresh token dạng plaintext. So sánh bằng hash_equals.
- OTP: hạn 10 phút (login_2fa: 5 phút), tối đa 5 lần sai/mã, cooldown gửi lại 60s.
- Mọi endpoint nhạy cảm có rate limit (login, send OTP, verify OTP, refresh, 2FA).
- Không bao giờ log OTP, token, mật khẩu.