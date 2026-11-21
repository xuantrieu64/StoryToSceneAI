/*
 * ============================================================================
 *  LƯU BẢNG PHÂN CẢNH THEO TỪNG DỰ ÁN BẰNG localStorage (GIẢI PHÁP FRONTEND TẠM THỜI)
 * ============================================================================
 *  Khóa: `storytoscene.storyboards.v1.<projectId>` → { [scriptId]: Storyboard }.
 *  Mỗi tập kịch bản có tối đa một bảng phân cảnh. Mặc định rỗng – chỉ có dữ liệu
 *  sau khi người dùng bấm "Lập bảng phân cảnh" (hoặc nhắn trợ lý).
 *  Ảnh minh họa người dùng tải lên được thu nhỏ rồi lưu dạng data URL trong cú máy.
 *
 *  TODO(api): thay bằng API phân cảnh + kho ảnh khi backend sẵn sàng.
 * ============================================================================
 */

import { renameVoiceSetting } from './voice-settings'

export const SHOT_SIZES = ['Viễn cảnh', 'Toàn cảnh', 'Trung cảnh', 'Cận cảnh', 'Đặc tả'] as const
export type ShotSize = (typeof SHOT_SIZES)[number]

export const CAMERA_MOVES = ['Đứng yên', 'Đẩy chậm vào', 'Kéo ra', 'Lia máy', 'Máy cầm tay'] as const
export type CameraMove = (typeof CAMERA_MOVES)[number]

/** Tên chuyển động máy của bản lưu cũ → tên mới. */
const LEGACY_MOVES: Record<string, CameraMove> = { 'Máy tĩnh': 'Đứng yên', 'Đẩy máy': 'Đẩy chậm vào', 'Kéo máy': 'Kéo ra' }

export const ASPECT_RATIOS = ['16:9', '9:16', '1:1'] as const
export type AspectRatio = (typeof ASPECT_RATIOS)[number]

/** Khung hình AI (mô phỏng) của cú máy – trạng thái suy ra theo thời gian, nên chuyển trang không mất tiến trình. */
export type ShotFrameRender = {
  tier: 'standard' | 'premium'
  /** Thời điểm bắt đầu tạo (ms); trước mốc này = đang xếp hàng. */
  startedAt: number
  durationMs: number
  /** Biến thể hình (mỗi lần tạo lại ra một biến thể khác). */
  seed: number
  /** Lần tạo này thất bại (mô phỏng) – lộ ra khi hết thời gian tạo. */
  fails?: boolean
}

/** Giọng đọc (mô phỏng) của một câu – trạng thái suy ra theo thời gian như khung hình. */
export type VoiceRender = {
  startedAt: number
  durationMs: number
  /** Băm (lời + giọng + tốc độ) lúc đọc; khác hiện tại = cần đọc lại. */
  key: string
  chars: number
}

/** Clip video (mô phỏng) của cú máy – trạng thái suy ra theo thời gian như khung hình / giọng. */
export type ClipRender = {
  startedAt: number
  durationMs: number
  seed: number
  /** Độ phân giải lúc tạo, vd. "1080p". */
  resolution: string
  /** Băm (mô tả + cỡ cảnh + chuyển động + thời lượng + khung hình) lúc tạo; khác hiện tại = cần tạo lại. */
  key: string
  /** Model và độ dài clip lúc tạo (5 / 10 / 15 giây). */
  model?: string
  length?: number
  /** Lần tạo này thất bại (mô phỏng) – lộ ra khi hết thời gian tạo. */
  fails?: boolean
}

export const CLIP_LENGTHS = [5, 10, 15] as const
export type ClipLength = (typeof CLIP_LENGTHS)[number]
/** Thiết lập tạo video của tập (mục 8). */
export type VideoSettings = { model: string; clipLength: ClipLength }

export const EXPORT_ASPECTS = ['16:9', '9:16', '1:1'] as const
export const EXPORT_RESOLUTIONS = ['720p', '1080p', '2K', '4K'] as const
export const EXPORT_QUALITIES = ['Tiêu chuẩn', 'Cao', 'Tối đa'] as const
export type ExportSettings = {
  aspect: (typeof EXPORT_ASPECTS)[number]
  resolution: (typeof EXPORT_RESOLUTIONS)[number]
  quality: (typeof EXPORT_QUALITIES)[number]
}
/** Lần xuất phim gần nhất (mô phỏng). */
export type ExportJob = { settings: ExportSettings; startedAt: number; durationMs: number; clipsReady: number; clipsTotal: number }

export type Shot = {
  id: string
  /** Số thứ tự trong cả tập (1, 2, 3…). */
  number: number
  size: ShotSize
  movement: CameraMove
  /** Hình ảnh / hành động / bối cảnh trong khung. */
  description: string
  /** Nhân vật xuất hiện trong khung. */
  characters: string[]
  /** Nhân vật nói (nếu cú máy có thoại). */
  character?: string
  dialogue?: string
  /** Lời dẫn (thuyết minh) đọc trên cú máy. */
  narration?: string
  sound: string
  /** Thời lượng (giây). */
  duration: number
  /** Chuyển cảnh sau cú máy (vd. "Cắt sang"). */
  transition?: string
  /** Ảnh minh họa người dùng tải lên (data URL) – ưu tiên hơn khung hình AI. */
  image?: string
  /** Khung hình do bước Khung hình tạo (mục 6). */
  frame?: ShotFrameRender
  /** Cách nói của lời thoại, vd. "khẽ" (từ ghi chú trong ngoặc ở kịch bản). */
  delivery?: string
  /** Giọng đọc đã tạo ở bước Lồng tiếng (mục 7) cho thoại / lời dẫn. */
  voice?: { dialogue?: VoiceRender; narration?: VoiceRender }
  /** Clip video đã tạo ở bước Video (mục 8). */
  clip?: ClipRender
}

export type StoryboardScene = {
  id: string
  /** 0 = phần mở đầu trước cảnh đầu tiên. */
  number: number
  heading: string
  shots: Shot[]
}

export type Storyboard = {
  scriptId: string
  aspectRatio: AspectRatio
  scenes: StoryboardScene[]
  /** Thiết lập xuất phim đã chọn (mục 8). */
  exportSettings?: ExportSettings
  /** Model / độ dài clip khi tạo video (mục 8). */
  videoSettings?: VideoSettings
  exportJob?: ExportJob
  createdAt: string
  updatedAt: string
}

export type ShotPatch = Partial<Omit<Shot, 'id' | 'number'>>

const keyFor = (projectId: string) => `storytoscene.storyboards.v1.${projectId}`

const isString = (value: unknown): value is string => typeof value === 'string'
const optionalString = (key: string, value: unknown) => (isString(value) && value.trim() ? { [key]: value } : {})

function normalizeShot(value: unknown): Shot | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (!isString(item.id) || typeof item.number !== 'number' || !isString(item.description)) return null
  const movement = isString(item.movement) ? (LEGACY_MOVES[item.movement] ?? item.movement) : ''
  const characters = Array.isArray(item.characters) ? item.characters.filter(isString) : isString(item.character) ? [item.character] : []
  return {
    id: item.id,
    number: item.number,
    size: SHOT_SIZES.includes(item.size as ShotSize) ? (item.size as ShotSize) : 'Trung cảnh',
    movement: CAMERA_MOVES.includes(movement as CameraMove) ? (movement as CameraMove) : 'Đứng yên',
    description: item.description,
    characters,
    ...optionalString('character', item.character),
    ...optionalString('dialogue', item.dialogue),
    ...optionalString('narration', item.narration),
    sound: isString(item.sound) ? item.sound : '',
    duration: typeof item.duration === 'number' && item.duration > 0 ? item.duration : 3,
    ...optionalString('transition', item.transition),
    ...(isString(item.image) && item.image.startsWith('data:image/') ? { image: item.image } : {}),
    ...(normalizeFrame(item.frame) ? { frame: normalizeFrame(item.frame) } : {}),
    ...optionalString('delivery', item.delivery ?? legacyDelivery(item)),
    ...(normalizeVoice(item.voice) ? { voice: normalizeVoice(item.voice) } : {}),
    ...(normalizeClip(item.clip) ? { clip: normalizeClip(item.clip) } : {}),
  } as Shot
}

/** Bản lưu cũ: cách nói nằm trong mô tả "Linh (khẽ)." do bước lập bảng sinh ra. */
function legacyDelivery(item: Record<string, unknown>) {
  if (!isString(item.character) || !isString(item.description)) return undefined
  const match = item.description.match(/^(.+?) \(([^)]+)\)\.$/u)
  return match && match[1] === item.character ? match[2] : undefined
}

function normalizeVoiceRender(value: unknown): VoiceRender | undefined {
  if (!value || typeof value !== 'object') return undefined
  const item = value as Record<string, unknown>
  if (typeof item.startedAt !== 'number' || typeof item.durationMs !== 'number' || !isString(item.key)) return undefined
  return { startedAt: item.startedAt, durationMs: item.durationMs, key: item.key, chars: typeof item.chars === 'number' ? item.chars : 0 }
}

function normalizeVoice(value: unknown): Shot['voice'] | undefined {
  if (!value || typeof value !== 'object') return undefined
  const item = value as Record<string, unknown>
  const dialogue = normalizeVoiceRender(item.dialogue)
  const narration = normalizeVoiceRender(item.narration)
  return dialogue || narration ? { ...(dialogue ? { dialogue } : {}), ...(narration ? { narration } : {}) } : undefined
}

function normalizeClip(value: unknown): ClipRender | undefined {
  if (!value || typeof value !== 'object') return undefined
  const item = value as Record<string, unknown>
  if (typeof item.startedAt !== 'number' || typeof item.durationMs !== 'number' || typeof item.seed !== 'number' || !isString(item.key)) return undefined
  return {
    startedAt: item.startedAt,
    durationMs: item.durationMs,
    seed: item.seed,
    resolution: isString(item.resolution) ? item.resolution : '1080p',
    key: item.key,
    ...(isString(item.model) ? { model: item.model } : {}),
    ...(CLIP_LENGTHS.includes(item.length as ClipLength) ? { length: item.length as ClipLength } : {}),
    ...(item.fails === true ? { fails: true } : {}),
  }
}

function normalizeExportSettings(value: unknown): ExportSettings | undefined {
  if (!value || typeof value !== 'object') return undefined
  const item = value as Record<string, unknown>
  if (!EXPORT_ASPECTS.includes(item.aspect as ExportSettings['aspect']) || !EXPORT_RESOLUTIONS.includes(item.resolution as ExportSettings['resolution'])) return undefined
  return {
    aspect: item.aspect as ExportSettings['aspect'],
    resolution: item.resolution as ExportSettings['resolution'],
    quality: EXPORT_QUALITIES.includes(item.quality as ExportSettings['quality']) ? (item.quality as ExportSettings['quality']) : 'Cao',
  }
}

function normalizeVideoSettings(value: unknown): VideoSettings | undefined {
  if (!value || typeof value !== 'object') return undefined
  const item = value as Record<string, unknown>
  if (!isString(item.model)) return undefined
  return { model: item.model, clipLength: CLIP_LENGTHS.includes(item.clipLength as ClipLength) ? (item.clipLength as ClipLength) : 5 }
}

function normalizeExportJob(value: unknown): ExportJob | undefined {
  if (!value || typeof value !== 'object') return undefined
  const item = value as Record<string, unknown>
  const settings = normalizeExportSettings(item.settings)
  if (!settings || typeof item.startedAt !== 'number' || typeof item.durationMs !== 'number') return undefined
  return {
    settings,
    startedAt: item.startedAt,
    durationMs: item.durationMs,
    clipsReady: typeof item.clipsReady === 'number' ? item.clipsReady : 0,
    clipsTotal: typeof item.clipsTotal === 'number' ? item.clipsTotal : 0,
  }
}

function normalizeFrame(value: unknown): ShotFrameRender | undefined {
  if (!value || typeof value !== 'object') return undefined
  const item = value as Record<string, unknown>
  if (typeof item.startedAt !== 'number' || typeof item.durationMs !== 'number' || typeof item.seed !== 'number') return undefined
  return {
    tier: item.tier === 'premium' ? 'premium' : 'standard',
    startedAt: item.startedAt,
    durationMs: item.durationMs,
    seed: item.seed,
    ...(item.fails === true ? { fails: true } : {}),
  }
}

function normalizeStoryboard(value: unknown): Storyboard | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (!isString(item.scriptId) || !Array.isArray(item.scenes)) return null
  const scenes = item.scenes.flatMap((raw): StoryboardScene[] => {
    if (!raw || typeof raw !== 'object') return []
    const scene = raw as Record<string, unknown>
    if (!isString(scene.id) || typeof scene.number !== 'number' || !Array.isArray(scene.shots)) return []
    return [
      {
        id: scene.id,
        number: scene.number,
        heading: isString(scene.heading) ? scene.heading : '',
        shots: scene.shots.map(normalizeShot).filter((shot): shot is Shot => shot !== null),
      },
    ]
  })
  const createdAt = isString(item.createdAt) ? item.createdAt : new Date().toISOString()
  return {
    scriptId: item.scriptId,
    aspectRatio: ASPECT_RATIOS.includes(item.aspectRatio as AspectRatio) ? (item.aspectRatio as AspectRatio) : '16:9',
    scenes,
    ...(normalizeExportSettings(item.exportSettings) ? { exportSettings: normalizeExportSettings(item.exportSettings) } : {}),
    ...(normalizeExportJob(item.exportJob) ? { exportJob: normalizeExportJob(item.exportJob) } : {}),
    ...(normalizeVideoSettings(item.videoSettings) ? { videoSettings: normalizeVideoSettings(item.videoSettings) } : {}),
    createdAt,
    updatedAt: isString(item.updatedAt) ? item.updatedAt : createdAt,
  }
}

/** Bảng phân cảnh của một dự án, theo scriptId (rỗng nếu chưa có hoặc dữ liệu hỏng). */
export function loadStoryboards(projectId: string): Record<string, Storyboard> {
  try {
    const raw = window.localStorage.getItem(keyFor(projectId))
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const result: Record<string, Storyboard> = {}
    for (const value of Object.values(parsed as Record<string, unknown>)) {
      const board = normalizeStoryboard(value)
      if (board) result[board.scriptId] = board
    }
    return result
  } catch {
    return {}
  }
}

/** Lưu (ghi đè) bảng phân cảnh của một tập. false nếu trình duyệt từ chối ghi (vd. đầy bộ nhớ vì ảnh). */
export function saveStoryboard(projectId: string, storyboard: Storyboard): boolean {
  try {
    const all = loadStoryboards(projectId)
    all[storyboard.scriptId] = storyboard
    window.localStorage.setItem(keyFor(projectId), JSON.stringify(all))
    return true
  } catch {
    return false
  }
}

/** Số tập đã có bảng phân cảnh / tổng số tập (chỉ tính các tập còn tồn tại). */
export function storyboardProgress(projectId: string, scripts: { id: string }[]) {
  const boards = loadStoryboards(projectId)
  return { done: scripts.filter((script) => boards[script.id]).length, total: scripts.length }
}

export const allShots = (storyboard: Storyboard) => storyboard.scenes.flatMap((scene) => scene.shots)

export const totalDuration = (storyboard: Storyboard) => allShots(storyboard).reduce((sum, shot) => sum + shot.duration, 0)

/** Nhân vật xuất hiện trong một cảnh (theo thứ tự xuất hiện, không trùng). */
export const sceneCharacters = (scene: StoryboardScene) => [...new Set(scene.shots.flatMap((shot) => shot.characters))]

/** "Cảnh 1: Tiệm sách cũ · Đêm mưa" / "Mở đầu". */
export const sceneTitle = (scene: StoryboardScene) => (scene.number > 0 ? `Cảnh ${scene.number}: ${scene.heading}` : scene.heading)

/** "1 phút 05 giây" / "45 giây". */
export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return minutes > 0 ? `${minutes} phút ${String(rest).padStart(2, '0')} giây` : `${rest} giây`
}

/** "0:31" – dùng cho thước Timeline. */
export const formatClock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

/** Sửa một cú máy theo số thứ tự. Trả về bảng mới, hoặc null nếu không có cú máy đó. */
export function updateShot(storyboard: Storyboard, shotNumber: number, patch: ShotPatch): Storyboard | null {
  if (!allShots(storyboard).some((shot) => shot.number === shotNumber)) return null
  return {
    ...storyboard,
    updatedAt: new Date().toISOString(),
    scenes: storyboard.scenes.map((scene) => ({
      ...scene,
      shots: scene.shots.map((shot) => {
        if (shot.number !== shotNumber) return shot
        const next: Shot = { ...shot, ...patch }
        // Trường tùy chọn bị xóa trắng → bỏ hẳn khỏi dữ liệu
        for (const key of ['character', 'dialogue', 'narration', 'transition', 'image', 'delivery'] as const) {
          if (key in patch && !patch[key]?.trim()) delete next[key]
        }
        if ('frame' in patch && !patch.frame) delete next.frame
        if ('voice' in patch && !patch.voice) delete next.voice
        if ('clip' in patch && !patch.clip) delete next.clip
        return next
      }),
    })),
  }
}

const sameName = (a: string, b: string) => a.normalize('NFC').trim().toLocaleLowerCase('vi') === b.normalize('NFC').trim().toLocaleLowerCase('vi')

/**
 * Nhân vật đổi tên ở mục Nhân vật / Khung hình → cập nhật tên trong mọi bảng phân cảnh của dự án
 * (nhân vật trong khung + người nói). Trả về số cú máy đã cập nhật.
 */
export function renameCharacterInStoryboards(projectId: string, oldName: string, newName: string): number {
  if (oldName === newName) return 0
  renameVoiceSetting(projectId, oldName, newName)
  const boards = loadStoryboards(projectId)
  let changed = 0
  for (const board of Object.values(boards)) {
    let touched = false
    const scenes = board.scenes.map((scene) => ({
      ...scene,
      shots: scene.shots.map((shot) => {
        const inFrame = shot.characters.some((name) => sameName(name, oldName))
        const speaks = shot.character !== undefined && sameName(shot.character, oldName)
        if (!inFrame && !speaks) return shot
        touched = true
        changed += 1
        return {
          ...shot,
          characters: [...new Set(shot.characters.map((name) => (sameName(name, oldName) ? newName : name)))],
          ...(speaks ? { character: newName } : {}),
        }
      }),
    }))
    if (touched) saveStoryboard(projectId, { ...board, scenes, updatedAt: new Date().toISOString() })
  }
  return changed
}
