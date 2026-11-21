/*
 * Bước 8 – Video: tạo clip cho từng cú máy và xuất phim (mô phỏng, không gọi API tạo video).
 * Clip nằm trong cú máy (`shot.clip`) của bảng phân cảnh; trạng thái suy ra theo thời gian đã lưu
 * → chuyển trang / tải lại vẫn giữ tiến trình. Clip "cần tạo lại" khi cú máy đổi (mô tả, cỡ cảnh,
 * chuyển động, thời lượng) hoặc khung hình đổi – so khóa băm lúc tạo.
 * TODO(api): thay bằng job tạo / ghép video ở backend.
 */
import { frameStatus } from './frames'
import {
  allShots,
  loadStoryboards,
  updateShot,
  type CameraMove,
  type ExportSettings,
  type Shot,
  type ShotSize,
  type Storyboard,
  type VideoSettings,
} from './storyboard-storage'

/** Thời gian mô phỏng tạo một clip 5 giây (clip dài hơn / model cao hơn thì lâu hơn). */
export const CLIP_MS = 6000

export type ClipStatus = 'none' | 'queued' | 'generating' | 'ready' | 'outdated' | 'failed'

/** Model tạo video (mô phỏng – tên chung, không gắn dịch vụ thật). */
export const VIDEO_MODELS = [
  { id: 'draft', label: 'Nháp nhanh', credits: 1, speed: 0.7, note: 'nhanh, đủ để duyệt nhịp' },
  { id: 'standard', label: 'Tiêu chuẩn', credits: 1, speed: 1, note: 'cân bằng chất lượng và tốc độ' },
  { id: 'cinematic', label: 'Điện ảnh', credits: 2, speed: 1.6, note: 'chuyển động mượt, ánh sáng đẹp hơn' },
] as const

export const videoModelById = (id: string | undefined) => VIDEO_MODELS.find((model) => model.id === id) ?? VIDEO_MODELS[1]

export const defaultVideoSettings = (storyboard: Storyboard): VideoSettings => storyboard.videoSettings ?? { model: 'standard', clipLength: 5 }

/** Đặt `localStorage['storytoscene.clips.fail-rate'] = '1'` để mọi clip đều lỗi (kiểm tra giao diện), '0' để không lỗi. */
const FAIL_RATE_KEY = 'storytoscene.clips.fail-rate'
const DEFAULT_FAIL_RATE = 0.08

function failRate() {
  try {
    const raw = window.localStorage.getItem(FAIL_RATE_KEY)
    const value = Number(raw)
    return raw !== null && value >= 0 && value <= 1 ? value : DEFAULT_FAIL_RATE
  } catch {
    return DEFAULT_FAIL_RATE
  }
}

function hash(value: string) {
  let result = 5381
  for (const char of value) result = ((result * 33) ^ char.charCodeAt(0)) >>> 0
  return result.toString(36)
}

/** Khung hình mà clip dựa vào: ảnh tải lên / khung hình AI đã xong / khung tạm. */
function frameRef(shot: Shot) {
  if (shot.image) return `img${shot.image.length}`
  if (shot.frame && frameStatus(shot) === 'ready') return `ai${shot.frame.seed}`
  return 'temp'
}

export const clipKey = (shot: Shot) => hash(`${shot.description}|${shot.size}|${shot.movement}|${shot.duration}|${frameRef(shot)}`)

export function clipStatus(shot: Shot, now = Date.now()): ClipStatus {
  if (!shot.clip) return 'none'
  if (now < shot.clip.startedAt) return 'queued'
  if (now < shot.clip.startedAt + shot.clip.durationMs) return 'generating'
  if (shot.clip.fails) return 'failed'
  return shot.clip.key === clipKey(shot) ? 'ready' : 'outdated'
}

export const clipProgress = (shot: Shot, now = Date.now()) =>
  shot.clip ? Math.min(1, Math.max(0, (now - shot.clip.startedAt) / shot.clip.durationMs)) : 0

const clipEnd = (shot: Shot) => (shot.clip ? shot.clip.startedAt + shot.clip.durationMs : 0)

export const clipsDeadline = (storyboard: Storyboard | undefined) => (storyboard ? Math.max(0, ...allShots(storyboard).map(clipEnd)) : 0)

const isPending = (status: ClipStatus) => status === 'queued' || status === 'generating'

/** Cú máy chưa có clip, clip lỗi hoặc đã lỗi thời – mục tiêu của "Tạo video cho các cú máy còn thiếu". */
export const shotsMissingClips = (storyboard: Storyboard, now = Date.now()) =>
  allShots(storyboard)
    .filter((shot) => {
      const status = clipStatus(shot, now)
      return status === 'none' || status === 'outdated' || status === 'failed'
    })
    .map((shot) => shot.number)

export function clipStats(storyboard: Storyboard, now = Date.now()) {
  const statuses = allShots(storyboard).map((shot) => clipStatus(shot, now))
  return {
    total: statuses.length,
    ready: statuses.filter((status) => status === 'ready').length,
    pending: statuses.filter(isPending).length,
    outdated: statuses.filter((status) => status === 'outdated').length,
    failed: statuses.filter((status) => status === 'failed').length,
    secondsLeft: Math.max(0, Math.ceil((clipsDeadline(storyboard) - now) / 1000)),
  }
}

/** Xếp hàng tạo clip (nối tiếp sau các clip đang tạo) theo model + độ dài clip của tập. */
export function queueClips(storyboard: Storyboard, shotNumbers: number[], resolution: string, settings: VideoSettings, now = Date.now()): Storyboard {
  const pendingEnd = Math.max(0, ...allShots(storyboard).filter((shot) => isPending(clipStatus(shot, now))).map(clipEnd))
  const durationMs = Math.round(CLIP_MS * (settings.clipLength / 5) ** 0.6 * videoModelById(settings.model).speed)
  const rate = failRate()
  let cursor = Math.max(now, pendingEnd)
  let next = storyboard
  for (const shot of allShots(storyboard).filter((item) => shotNumbers.includes(item.number))) {
    const fails = Math.random() < rate
    next =
      updateShot(next, shot.number, {
        clip: {
          startedAt: cursor,
          durationMs,
          seed: Math.floor(Math.random() * 1_000_000),
          resolution,
          key: clipKey(shot),
          model: settings.model,
          length: settings.clipLength,
          ...(fails ? { fails } : {}),
        },
      }) ?? next
    cursor += durationMs
  }
  return next
}

/* --------------------------------- Lượt video / ngày --------------------------------- */

const USAGE_KEY = 'storytoscene.video-usage.v1'
export const VIDEO_DAILY_LIMIT = 30

function today() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function usedVideoCreditsToday() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(USAGE_KEY) ?? 'null') as { date?: string; used?: number } | null
    return parsed?.date === today() ? Math.max(0, Number(parsed.used) || 0) : 0
  } catch {
    return 0
  }
}

export const remainingVideoCredits = () => Math.max(0, VIDEO_DAILY_LIMIT - usedVideoCreditsToday())

/** Trừ lượt; false nếu không đủ hoặc không ghi được. */
export function consumeVideoCredits(credits: number): boolean {
  const used = usedVideoCreditsToday()
  if (used + credits > VIDEO_DAILY_LIMIT) return false
  try {
    window.localStorage.setItem(USAGE_KEY, JSON.stringify({ date: today(), used: used + credits }))
    return true
  } catch {
    return false
  }
}

/* ------------------------------ Chuyển động khi xem thử ------------------------------ */

/** Biến đổi khung hình theo kiểu máy (t: 0 → 1) – dùng cho xem thử clip và bản dựng nháp. */
export function cameraTransform(movement: CameraMove, t: number, seed: number) {
  switch (movement) {
    case 'Đẩy chậm vào':
      return `scale(${1 + 0.12 * t})`
    case 'Kéo ra':
      return `scale(${1.12 - 0.12 * t})`
    case 'Lia máy':
      return `scale(1.12) translateX(${(t - 0.5) * -8}%)`
    case 'Máy cầm tay':
      return `scale(1.06) translate(${Math.sin(t * 22 + seed) * 0.6}%, ${Math.cos(t * 17 + seed) * 0.5}%)`
    default:
      return 'scale(1)'
  }
}

/** Tiến độ clip của cả dự án – cho Sidebar / Tổng quan. */
export function episodeClipProgress(projectId: string, scripts: { id: string }[], now = Date.now()) {
  const boards = loadStoryboards(projectId)
  const shots = scripts.flatMap((script) => (boards[script.id] ? allShots(boards[script.id]) : []))
  return { ready: shots.filter((shot) => clipStatus(shot, now) === 'ready').length, total: shots.length }
}

/* -------------------------------- Thông số kỹ thuật -------------------------------- */

const LENS: Record<ShotSize, { lens: string; aperture: string }> = {
  'Viễn cảnh': { lens: '24mm', aperture: 'f/8' },
  'Toàn cảnh': { lens: '28mm', aperture: 'f/5.6' },
  'Trung cảnh': { lens: '35mm', aperture: 'f/2.8' },
  'Cận cảnh': { lens: '50mm', aperture: 'f/2' },
  'Đặc tả': { lens: '85mm macro', aperture: 'f/2.8' },
}

/** Ống kính / khẩu độ gợi ý theo cỡ cảnh (mô phỏng thông số máy quay). */
export const lensFor = (size: ShotSize) => LENS[size]

/* ------------------------------------ Xuất phim ------------------------------------ */

export const defaultExportSettings = (storyboard: Storyboard): ExportSettings =>
  storyboard.exportSettings ?? { aspect: storyboard.aspectRatio, resolution: '1080p', quality: 'Cao' }

export type ExportStatus = 'none' | 'exporting' | 'done'

export function exportStatus(storyboard: Storyboard, now = Date.now()): ExportStatus {
  const job = storyboard.exportJob
  if (!job) return 'none'
  return now < job.startedAt + job.durationMs ? 'exporting' : 'done'
}

export const exportProgress = (storyboard: Storyboard, now = Date.now()) => {
  const job = storyboard.exportJob
  return job ? Math.min(1, Math.max(0, (now - job.startedAt) / job.durationMs)) : 0
}

export const exportDeadline = (storyboard: Storyboard | undefined) => (storyboard?.exportJob ? storyboard.exportJob.startedAt + storyboard.exportJob.durationMs : 0)

/** Thời gian mô phỏng xuất phim: nặng hơn với độ phân giải / chất lượng cao. */
export function startExport(storyboard: Storyboard, settings: ExportSettings, now = Date.now()): Storyboard {
  const factor = { '720p': 0.7, '1080p': 1, '2K': 1.4, '4K': 2 }[settings.resolution] * { 'Tiêu chuẩn': 0.8, Cao: 1, 'Tối đa': 1.3 }[settings.quality]
  const stats = clipStats(storyboard, now)
  return {
    ...storyboard,
    exportSettings: settings,
    exportJob: { settings, startedAt: now, durationMs: Math.round((2500 + stats.total * 500) * factor), clipsReady: stats.ready, clipsTotal: stats.total },
  }
}

/* ------------------------------------ Tải file ------------------------------------ */

const pad = (value: number) => String(value).padStart(2, '0')
/** Mã thời gian HH:MM:SS:FF (25 khung/giây). */
const timecode = (seconds: number) => `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(Math.floor(seconds % 60))}:00`

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/**
 * Danh sách dựng (EDL, định dạng CMX3600) của bản phim – mở được trong phần mềm dựng để ráp clip thật sau này.
 * Chưa ghép video thật ở giai đoạn này.
 */
export function downloadEdl(storyboard: Storyboard, title: string, fileName: string) {
  const lines = [`TITLE: ${title}`, 'FCM: NON-DROP FRAME', '']
  let record = 0
  for (const shot of allShots(storyboard)) {
    const event = String(shot.number).padStart(3, '0')
    lines.push(`${event}  CU${String(shot.number).padStart(3, '0')}  V     C        ${timecode(0)} ${timecode(shot.duration)} ${timecode(record)} ${timecode(record + shot.duration)}`)
    lines.push(`* FROM CLIP NAME: cu-may-${shot.number}.webm`)
    lines.push(`* COMMENT: ${shot.size} · ${shot.movement} · ${shot.description.replace(/\s+/g, ' ').slice(0, 120)}`)
    if (shot.dialogue) lines.push(`* DIALOGUE: ${shot.character ?? ''}: ${shot.dialogue.replace(/\s+/g, ' ')}`)
    lines.push('')
    record += shot.duration
  }
  downloadBlob(new Blob([lines.join('\r\n')], { type: 'text/plain;charset=utf-8' }), fileName)
}

/**
 * Clip giữ chỗ dạng .webm: vẽ thẻ cú máy lên canvas (nền, tiêu đề, mô tả, thoại, thanh thời gian) rồi ghi lại
 * bằng MediaRecorder đúng thời lượng cú máy. Là video hợp lệ, không phải video AI.
 */
export async function recordPlaceholderClip(shot: Shot, sceneHeading: string, fileName: string) {
  if (typeof MediaRecorder === 'undefined') throw new Error('Trình duyệt không hỗ trợ ghi video.')
  const canvas = document.createElement('canvas')
  canvas.width = 640
  canvas.height = 360
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Trình duyệt không vẽ được video.')
  const stream = canvas.captureStream(25)
  const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((type) => MediaRecorder.isTypeSupported(type))
  if (!mimeType) throw new Error('Trình duyệt không hỗ trợ định dạng WebM.')
  const recorder = new MediaRecorder(stream, { mimeType })
  const chunks: Blob[] = []
  recorder.ondataavailable = (event) => event.data.size > 0 && chunks.push(event.data)
  const night = /đêm|tối|khuya/u.test(sceneHeading.toLocaleLowerCase('vi'))
  const durationMs = shot.duration * 1000

  const wrap = (text: string, maxWidth: number) => {
    const words = text.split(/\s+/)
    const rows: string[] = []
    let row = ''
    for (const word of words) {
      const test = row ? `${row} ${word}` : word
      if (context.measureText(test).width > maxWidth && row) {
        rows.push(row)
        row = word
      } else row = test
    }
    if (row) rows.push(row)
    return rows.slice(0, 3)
  }

  const draw = (elapsed: number) => {
    const t = Math.min(1, elapsed / durationMs)
    const zoom = 1 + t * 0.06 // đẩy máy chậm
    context.save()
    context.translate(320, 180)
    context.scale(zoom, zoom)
    context.translate(-320, -180)
    const gradient = context.createLinearGradient(0, 0, 0, 360)
    gradient.addColorStop(0, night ? '#1e293b' : '#f1f8f0')
    gradient.addColorStop(1, night ? '#334155' : '#cfe6cd')
    context.fillStyle = gradient
    context.fillRect(0, 0, 640, 360)
    context.restore()
    context.fillStyle = night ? '#f8fafc' : '#111827'
    context.font = 'bold 26px sans-serif'
    context.fillText(`Cú máy ${shot.number} · ${shot.size}`, 32, 56)
    context.font = '16px sans-serif'
    context.fillStyle = night ? '#cbd5e1' : '#374151'
    context.fillText(sceneHeading, 32, 84)
    context.font = '18px sans-serif'
    wrap(shot.description, 576).forEach((row, index) => context.fillText(row, 32, 140 + index * 26))
    if (shot.dialogue) {
      context.fillStyle = 'rgba(0,0,0,0.55)'
      context.fillRect(0, 276, 640, 44)
      context.fillStyle = '#ffffff'
      context.font = '17px sans-serif'
      context.fillText(`${shot.character ?? ''}: “${shot.dialogue}”`.slice(0, 70), 24, 304)
    }
    context.fillStyle = '#39b536'
    context.fillRect(0, 352, 640 * t, 8)
  }

  await new Promise<void>((resolve) => {
    recorder.onstop = () => resolve()
    recorder.start()
    const start = performance.now()
    const tick = () => {
      const elapsed = performance.now() - start
      draw(elapsed)
      if (elapsed < durationMs) requestAnimationFrame(tick)
      else recorder.stop()
    }
    tick()
  })
  stream.getTracks().forEach((track) => track.stop())
  downloadBlob(new Blob(chunks, { type: 'video/webm' }), fileName)
}
