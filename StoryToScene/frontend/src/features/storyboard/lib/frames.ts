/*
 * Bước 6 – Khung hình: tạo ảnh cho từng cú máy của bảng phân cảnh (mục 5).
 * Không có danh sách riêng: khung hình nằm ngay trong cú máy (`shot.frame`) của bảng phân cảnh,
 * nên thêm / sửa / lập lại cú máy ở mục 5 thì mục 6 thấy ngay.
 *
 * Mô phỏng (chưa có AI, không gọi API nào): mỗi ảnh mất FRAME_MS, các ảnh xếp hàng nối tiếp nhau.
 * Trạng thái (chờ / đang tạo / xong / lỗi) suy ra từ thời điểm đã lưu nên chuyển trang hay tải lại
 * vẫn giữ tiến trình. Ảnh "xong" là khung hình SVG vẽ ngay trên frontend (ShotFrame).
 * Thất bại được mô phỏng ngẫu nhiên theo FAIL_RATE (đổi bằng localStorage để kiểm tra giao diện).
 * TODO(api): thay bằng job tạo ảnh ở backend.
 */
import type { GenerationTierId } from '@/features/characters/data/generation-tiers'
import { allShots, loadStoryboards, type Shot, type Storyboard } from './storyboard-storage'

/** Thời gian mô phỏng tạo một ảnh. */
export const FRAME_MS = 5000

/** Tỉ lệ thất bại mặc định của mô phỏng. */
const DEFAULT_FAIL_RATE = 0.1
/** Đặt `localStorage['storytoscene.frames.fail-rate'] = '1'` để mọi ảnh đều lỗi (kiểm tra giao diện), '0' để không bao giờ lỗi. */
const FAIL_RATE_KEY = 'storytoscene.frames.fail-rate'

function failRate() {
  try {
    const value = Number(window.localStorage.getItem(FAIL_RATE_KEY))
    return window.localStorage.getItem(FAIL_RATE_KEY) !== null && value >= 0 && value <= 1 ? value : DEFAULT_FAIL_RATE
  } catch {
    return DEFAULT_FAIL_RATE
  }
}

export type FrameStatus = 'none' | 'queued' | 'generating' | 'ready' | 'failed'

export function frameStatus(shot: Shot, now = Date.now()): FrameStatus {
  if (!shot.frame) return 'none'
  if (now < shot.frame.startedAt) return 'queued'
  if (now < shot.frame.startedAt + shot.frame.durationMs) return 'generating'
  return shot.frame.fails ? 'failed' : 'ready'
}

/** Tiến độ của ảnh đang tạo (0–1). */
export const frameProgress = (shot: Shot, now = Date.now()) =>
  shot.frame ? Math.min(1, Math.max(0, (now - shot.frame.startedAt) / shot.frame.durationMs)) : 0

const frameEnd = (shot: Shot) => (shot.frame ? shot.frame.startedAt + shot.frame.durationMs : 0)

/** Mốc ảnh cuối cùng của bảng tạo xong (0 = không có gì đang chạy) – dùng cho đồng hồ useNow. */
export const framesDeadline = (storyboard: Storyboard | undefined) => (storyboard ? Math.max(0, ...allShots(storyboard).map(frameEnd)) : 0)

/** Cú máy đang chờ / đang tạo ảnh. */
export const pendingShots = (storyboard: Storyboard, now = Date.now()) =>
  allShots(storyboard).filter((shot) => {
    const status = frameStatus(shot, now)
    return status === 'queued' || status === 'generating'
  })

export function frameStats(storyboard: Storyboard, now = Date.now()) {
  const shots = allShots(storyboard)
  const pending = pendingShots(storyboard, now)
  const ready = shots.filter((shot) => hasFrameImage(shot, now)).length
  return {
    total: shots.length,
    ready,
    pending: pending.length,
    failed: shots.filter((shot) => !shot.image && frameStatus(shot, now) === 'failed').length,
    /** Chưa có ảnh và không đang tạo (chưa tạo + lỗi). */
    missing: shotsMissingFrames(storyboard, now).length,
    secondsLeft: Math.max(0, Math.ceil((framesDeadline(storyboard) - now) / 1000)),
  }
}

/** Cú máy đã có hình hiển thị (ảnh tải lên hoặc khung hình AI đã xong). */
export const hasFrameImage = (shot: Shot, now = Date.now()) => Boolean(shot.image) || frameStatus(shot, now) === 'ready'

/**
 * Xếp hàng tạo ảnh cho các cú máy (theo thứ tự cú máy), nối tiếp sau các ảnh đang chạy.
 * Tạo lại = bỏ ảnh tải lên cũ, ra biến thể mới.
 */
export function queueFrames(storyboard: Storyboard, shotNumbers: number[], tier: GenerationTierId, now = Date.now()): Storyboard {
  const wanted = new Set(shotNumbers)
  let cursor = Math.max(now, ...pendingShots(storyboard, now).map(frameEnd))
  return {
    ...storyboard,
    updatedAt: new Date(now).toISOString(),
    scenes: storyboard.scenes.map((scene) => ({
      ...scene,
      shots: scene.shots.map((shot) => {
        if (!wanted.has(shot.number)) return shot
        const startedAt = cursor
        cursor += FRAME_MS
        const { image: _uploaded, ...rest } = shot
        const fails = Math.random() < failRate()
        return { ...rest, frame: { tier, startedAt, durationMs: FRAME_MS, seed: Math.floor(Math.random() * 1_000_000), ...(fails ? { fails } : {}) } }
      }),
    })),
  }
}

/** Cú máy chưa có hình và không đang tạo (chưa tạo hoặc lỗi) – mục tiêu của "Tạo ảnh cho các cú máy còn thiếu". */
export function shotsMissingFrames(storyboard: Storyboard, now = Date.now()) {
  return allShots(storyboard)
    .filter((shot) => {
      const status = frameStatus(shot, now)
      return !shot.image && (status === 'none' || status === 'failed')
    })
    .map((shot) => shot.number)
}

export const TIER_DESCRIPTIONS: Record<GenerationTierId, string> = {
  standard: 'Thường: tạo nhanh, đủ để duyệt bố cục và nhịp cảnh.',
  premium: 'Cao cấp: nét hơn, giữ mặt nhân vật theo ảnh mẫu (tối đa 4 người mỗi ảnh).',
}

/** Tiến độ khung hình của cả dự án (mọi tập đã có bảng phân cảnh) – cho Sidebar / Tổng quan. */
export function episodeFrameProgress(projectId: string, scripts: { id: string }[], now = Date.now()) {
  const boards = loadStoryboards(projectId)
  const shots = scripts.flatMap((script) => (boards[script.id] ? allShots(boards[script.id]) : []))
  return { ready: shots.filter((shot) => hasFrameImage(shot, now)).length, total: shots.length }
}
