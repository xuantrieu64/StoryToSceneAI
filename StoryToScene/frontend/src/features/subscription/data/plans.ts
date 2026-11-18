/*
 * Dữ liệu các gói dịch vụ trên trang Nâng cấp gói (/upgrade).
 *
 * Nội dung hiển thị trên thẻ gói (tên, đối tượng, giá, mô tả, tính năng, nút)
 * lấy TRỰC TIẾP từ `pricingPlans` của trang chủ – sửa tại
 * `src/features/home/data/home-content.ts` thì cả hai trang cùng cập nhật.
 *
 * File này chỉ bổ sung phần trang chủ không có: hạn mức (cho khối sử dụng /
 * thống kê) và các cờ tính năng (cho bảng so sánh). Khi backend có API gói, thay tại đây.
 */
import { pricingPlans, type PricingPlan } from '@/features/home/data/home-content'

export type PlanId = PricingPlan['id']
export type BillingCycle = 'monthly' | 'yearly'
export type ExportResolution = '720p' | '1080p' | '4K'

/** Mức giảm khi thanh toán theo năm (nhãn "Tiết kiệm 20%"). */
export const YEARLY_DISCOUNT = 0.2

/** Nhãn của gói nổi bật – giống nhãn trong PricingSection trang chủ. */
export const FEATURED_BADGE = 'Phổ biến nhất • Tiết kiệm 40%'

type PlanDetails = {
  limits: {
    /** null = không giới hạn */
    projects: number | null
    aiCreditsPerMonth: number
    exportResolution: ExportResolution
    /** Dung lượng lưu trữ (MB). null = chưa xác định. */
    storageMb: number | null
  }
  features: {
    templateLibrary: boolean
    priorityProcessing: boolean
    earlyAccess: boolean
  }
}

export type SubscriptionPlan = PlanDetails & {
  id: PlanId
  name: string
  /** Nội dung thẻ gói, dùng chung với trang chủ. */
  content: PricingPlan
  /** Giá theo tháng (VND), suy ra từ `content.price`. */
  monthlyPrice: number
  featured: boolean
  /**
   * Link trang thanh toán (lấy từ `cta.href` trang chủ, hiện chưa cấu hình).
   * Chưa có link → nút nâng cấp báo "sắp ra mắt", không tạo giao dịch.
   */
  checkoutHref?: Partial<Record<BillingCycle, string>>
}

/** Hạn mức & tính năng theo thiết kế trang Nâng cấp gói. */
const planDetails: Record<PlanId, PlanDetails> = {
  free: {
    limits: { projects: 1, aiCreditsPerMonth: 10, exportResolution: '720p', storageMb: 100 },
    features: { templateLibrary: false, priorityProcessing: false, earlyAccess: false },
  },
  basic: {
    limits: { projects: 10, aiCreditsPerMonth: 100, exportResolution: '1080p', storageMb: null },
    features: { templateLibrary: true, priorityProcessing: false, earlyAccess: false },
  },
  pro: {
    limits: { projects: null, aiCreditsPerMonth: 500, exportResolution: '4K', storageMb: null },
    features: { templateLibrary: true, priorityProcessing: true, earlyAccess: true },
  },
}

/** "99.000" → 99000 */
const parseVnd = (value: string) => Number(value.replace(/\D/g, '')) || 0

export const subscriptionPlans: SubscriptionPlan[] = pricingPlans.map((content) => ({
  id: content.id,
  name: content.name,
  content,
  monthlyPrice: parseVnd(content.price),
  featured: content.highlighted === true,
  checkoutHref: content.id === 'free' || !content.cta.href ? undefined : { monthly: content.cta.href },
  ...planDetails[content.id],
}))

export const planRank: Record<PlanId, number> = { free: 0, basic: 1, pro: 2 }

export function getPlan(id: PlanId) {
  const plan = subscriptionPlans.find((item) => item.id === id)
  if (!plan) throw new Error(`Không tìm thấy gói "${id}"`)
  return plan
}

/** Giá theo chu kỳ: tháng = giá gốc; năm = 12 tháng trừ YEARLY_DISCOUNT. */
export function priceFor(plan: SubscriptionPlan, cycle: BillingCycle) {
  return cycle === 'monthly' ? plan.monthlyPrice : Math.round(plan.monthlyPrice * 12 * (1 - YEARLY_DISCOUNT))
}

/* ---------------------------- Bảng so sánh tính năng ---------------------------- */

export type ComparisonRowId = 'projects' | 'aiCredits' | 'resolution' | 'templates' | 'priority' | 'earlyAccess'

export type ComparisonRow = {
  id: ComparisonRowId
  label: string
  /** string = giá trị hiển thị; boolean = có / không có. */
  value: (plan: SubscriptionPlan) => string | boolean
}

export const comparisonRows: ComparisonRow[] = [
  { id: 'projects', label: 'Số dự án tối đa', value: (p) => (p.limits.projects === null ? 'Không giới hạn' : String(p.limits.projects)) },
  { id: 'aiCredits', label: 'Lượt AI / tháng', value: (p) => String(p.limits.aiCreditsPerMonth) },
  { id: 'resolution', label: 'Độ phân giải xuất video', value: (p) => p.limits.exportResolution },
  { id: 'templates', label: 'Thư viện mẫu', value: (p) => p.features.templateLibrary },
  { id: 'priority', label: 'Ưu tiên xử lý', value: (p) => p.features.priorityProcessing },
  { id: 'earlyAccess', label: 'Tính năng mới (sớm)', value: (p) => p.features.earlyAccess },
]
