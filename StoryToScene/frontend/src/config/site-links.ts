/**
 * Đích đến của các trang / tích hợp nằm NGOÀI Homepage.
 *
 * Hiện backend chưa có route đăng nhập, đăng ký, Studio, thanh toán hay các
 * trang pháp lý, nên các giá trị dưới đây đang để `undefined`. Component
 * `ActionLink` sẽ hiển thị chúng ở trạng thái "Sắp ra mắt" (không bấm được)
 * thay vì tạo link chết hoặc chức năng giả.
 *
 * Khi trang thật sẵn sàng, chỉ cần điền URL vào đây – toàn bộ nút/link liên
 * quan trên Homepage sẽ tự hoạt động.
 */
export const siteLinks: Record<
  | 'login'
  | 'register'
  | 'studio'
  | 'checkoutBasic'
  | 'checkoutPro'
  | 'zaloSupport'
  | 'community'
  | 'terms'
  | 'privacy'
  | 'aiCopyright'
  | 'contact',
  string | undefined
> = {
  login: undefined,
  register: undefined,
  studio: undefined,
  checkoutBasic: undefined,
  checkoutPro: undefined,
  zaloSupport: undefined,
  community: undefined,
  terms: undefined,
  privacy: undefined,
  aiCopyright: undefined,
  contact: undefined,
}

/** Anchor của các section trên Homepage. */
export const sectionIds = {
  hero: 'top',
  genres: 'the-loai',
  demo: 'kich-ban-mau',
  howItWorks: 'cach-hoat-dong',
  pricing: 'bang-gia',
  faq: 'hoi-dap',
} as const

export const anchor = (id: string) => `#${id}`
