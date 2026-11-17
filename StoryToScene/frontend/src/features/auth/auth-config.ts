import { sectionIds } from '@/config/site-links'

/** Đường dẫn dùng trong các trang xác thực (khớp với route khai báo trong App.tsx). */
export const authRoutes = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
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

/** Thông báo dùng chung khi backend chưa có API xác thực (routes/api.php chỉ có /user và /health). */
export const AUTH_NOT_CONNECTED =
  'Chức năng này chưa được kết nối máy chủ (backend chưa có API đăng nhập/đăng ký). Dữ liệu bạn nhập chưa được gửi đi.'
