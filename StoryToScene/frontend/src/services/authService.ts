import { api } from '@/lib/api'
import type {
  CurrentUserResponse,
  GoogleLoginPayload,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  SessionResponse,
  VerifyEmailPayload,
} from '@/types/auth'

export const authService = {
  register(payload: RegisterPayload): Promise<RegisterResponse> {
    return api.post<RegisterResponse>('/auth/register', payload).then((response) => response.data)
  },

  verifyEmail(payload: VerifyEmailPayload): Promise<SessionResponse> {
    return api.post<SessionResponse>('/auth/verify-email', payload).then((response) => response.data)
  },

  resendOtp(email: string): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/resend-otp', {
      email,
      purpose: 'register',
    }).then((response) => response.data)
  },

  login(payload: LoginPayload): Promise<LoginResponse> {
    return api.post<LoginResponse>('/auth/login', payload).then((response) => response.data)
  },

  refresh(): Promise<SessionResponse> {
    return api.post<SessionResponse>('/auth/refresh', undefined).then((response) => response.data)
  },

  logout(): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/logout').then((response) => response.data)
  },

  getCurrentUser(): Promise<CurrentUserResponse> {
    return api.get<CurrentUserResponse>('/me').then((response) => response.data)
  },

  // TODO: Google login cần credential id_token lấy từ Google Identity Services.
  googleLogin(_payload: GoogleLoginPayload): Promise<LoginResponse> {
    throw new Error('Google login chưa được triển khai trên giao diện.')
  },

  // TODO: 2FA cần màn hình nhập OTP/mã khôi phục và gọi POST /auth/2fa/verify.
  verifyTwoFactor(_twoFactorToken: string, _otp?: string, _recoveryCode?: string): Promise<SessionResponse> {
    throw new Error('Luồng xác thực hai lớp chưa được triển khai trên giao diện.')
  },
}
