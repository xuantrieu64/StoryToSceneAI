/*
 * Lượt AI lập bảng phân cảnh đã dùng hôm nay (localStorage, mô phỏng hạn mức gói).
 * Sang ngày mới (theo giờ máy) thì tự về 0. Sửa cú máy qua chat không tính lượt.
 * TODO(api): lấy hạn mức theo gói của tài khoản khi backend sẵn sàng.
 */
const USAGE_KEY = 'storytoscene.storyboard-usage.v1'

export const STORYBOARD_DAILY_LIMIT = 30

function today() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function usedToday(): number {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(USAGE_KEY) ?? 'null') as { date?: string; used?: number } | null
    return parsed?.date === today() ? Math.max(0, Number(parsed.used) || 0) : 0
  } catch {
    return 0
  }
}

export const remainingStoryboardRuns = () => Math.max(0, STORYBOARD_DAILY_LIMIT - usedToday())

/** Dùng 1 lượt; false nếu đã hết lượt hôm nay hoặc không ghi được. */
export function consumeStoryboardRun(): boolean {
  const used = usedToday()
  if (used >= STORYBOARD_DAILY_LIMIT) return false
  try {
    window.localStorage.setItem(USAGE_KEY, JSON.stringify({ date: today(), used: used + 1 }))
    return true
  } catch {
    return false
  }
}
