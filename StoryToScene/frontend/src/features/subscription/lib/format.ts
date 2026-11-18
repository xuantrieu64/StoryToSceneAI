const numberFormatter = new Intl.NumberFormat('vi-VN')

/** 99000 → "99.000" (cách viết giá giống trang chủ, đơn vị "VND" ghi riêng) */
export const formatNumber = (value: number) => numberFormatter.format(value)

/** Tỉ lệ sử dụng (0–100). Hạn mức null/0 → 0. */
export function usagePercent(used: number, limit: number | null) {
  if (!limit) return 0
  return Math.min(100, Math.round((used / limit) * 100))
}

export function formatExpiry(expiresAt: string | null) {
  if (!expiresAt) return 'Không thời hạn'
  return new Date(expiresAt).toLocaleDateString('vi-VN')
}

export const formatLimit = (limit: number | null) => (limit === null ? '∞' : String(limit))
