import { sectionIds } from '@/config/site-links'

/** Đường dẫn dùng trong các trang xác thực. */
export const authRoutes = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
} as const

/** Endpoint xác thực của backend Laravel (base API: VITE_API_URL + /v1). */
export const authEndpoints = {
  register: '/auth/register',
  verifyEmail: '/auth/verify-email',
  resendOtp: '/auth/resend-otp',
  login: '/auth/login',
  googleLogin: '/auth/google',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
  twoFactorVerify: '/auth/2fa/verify',
  twoFactorResend: '/auth/2fa/resend',
  currentUser: '/me',
} as const

/** Link tới một section trên trang chủ (tải trang chủ rồi cuộn tới section). */
const homeSection = (id: string) => `/#${id}`

/** Menu header trang Đăng nhập / Đăng ký – trỏ tới các section đã có trên trang chủ. */
export const authNav = {
  /** Dropdown "Tính năng" */
  features: [
    { label: 'Cách hoạt động', href: homeSection(sectionIds.pipeline) },
    { label: 'Thể loại truyện', href: homeSection(sectionIds.genres) },
    { label: 'Quy trình sản xuất', href: homeSection(sectionIds.steps) },
  ],
  links: [
    { label: 'Bảng giá', href: homeSection(sectionIds.pricing) },
    { label: 'Hướng dẫn', href: homeSection(sectionIds.faq) },
    { label: 'Blog', href: homeSection(sectionIds.blog) },
  ],
}

/** Thông báo chung cho chức năng chưa có giao diện hoặc chưa nối Google/2FA. */
export const AUTH_NOT_CONNECTED =
  'Chức năng này chưa được triển khai trên giao diện.'
