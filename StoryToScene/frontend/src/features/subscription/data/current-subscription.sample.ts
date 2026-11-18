/*
 * ============================================================================
 *  ⚠️ DỮ LIỆU MẪU – GÓI HIỆN TẠI & MỨC SỬ DỤNG
 * ============================================================================
 *  Backend chưa có API trả về gói đang dùng và mức sử dụng của tài khoản.
 *  Các số liệu dưới đây lấy theo ảnh thiết kế, CHỈ để hiển thị giao diện.
 *
 *  TODO(api): thay `sampleCurrentSubscription` bằng dữ liệu từ backend
 *  (vd. GET /api/subscription) rồi bỏ cờ `isSample`.
 * ============================================================================
 */
import type { PlanId } from './plans'

export type CurrentSubscription = {
  /** true = dữ liệu mẫu, chưa lấy từ backend. */
  isSample: boolean
  planId: PlanId
  /** ISO date; null = không thời hạn. */
  expiresAt: string | null
  usage: {
    aiCredits: number
    projects: number
    storageMb: number
  }
}

export const sampleCurrentSubscription: CurrentSubscription = {
  isSample: true,
  planId: 'free',
  expiresAt: null,
  usage: {
    aiCredits: 7,
    projects: 1,
    storageMb: 15,
  },
}
