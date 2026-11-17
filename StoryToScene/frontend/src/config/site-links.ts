/**
 * Đích đến của các trang / tích hợp nằm NGOÀI Homepage.
 *
 * - Đường dẫn nội bộ (bắt đầu bằng "/") được điều hướng bằng react-router.
 * - Giá trị `undefined` = trang/tích hợp chưa tồn tại: `ActionLink` hiển thị
 *   trạng thái "Sắp ra mắt" (không bấm được) thay vì tạo link chết.
 *
 * Khi trang thật sẵn sàng, chỉ cần điền URL vào đây.
 */
export const siteLinks: Record<
  | 'login'
  | 'register'
  | 'studio'
  | 'checkoutBasic'
  | 'checkoutPro'
  | 'blog'
  | 'releaseNotes'
  | 'docs'
  | 'community'
  | 'terms'
  | 'privacy'
  | 'copyright'
  | 'partnership'
  | 'website'
  | 'email'
  | 'zalo',
  string | undefined
> = {
  login: '/login',
  /** Trang đăng ký – các nút "Bắt đầu miễn phí" / "Dùng thử miễn phí" trên trang chủ. */
  register: '/register',
  studio: '/dashboard',
  checkoutBasic: undefined,
  checkoutPro: undefined,
  blog: undefined,
  releaseNotes: undefined,
  docs: undefined,
  community: undefined,
  terms: undefined,
  privacy: undefined,
  copyright: undefined,
  partnership: undefined,
  website: undefined,
  email: undefined,
  zalo: undefined,
}

/** Anchor của các section trên Homepage. */
export const sectionIds = {
  top: 'top',
  genres: 'the-loai',
  pipeline: 'cach-hoat-dong',
  steps: 'quy-trinh',
  pricing: 'bang-gia',
  testimonials: 'danh-gia',
  faq: 'hoi-dap',
  blog: 'goc-dien-anh',
} as const

export const anchor = (id: string) => `#${id}`
