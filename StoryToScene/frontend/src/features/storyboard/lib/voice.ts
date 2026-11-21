/*
 * Bước 7 – Lồng tiếng: đọc lời thoại / lời dẫn của từng cú máy trong bảng phân cảnh (mục 5).
 * Không có danh sách câu riêng: câu được suy ra từ cú máy (thoại + lời dẫn), giọng đã đọc nằm trong
 * `shot.voice` → sửa lời ở mục 5 hay ở đây đều là một nguồn dữ liệu.
 *
 * Mô phỏng (không TTS, không API): mỗi câu "đọc" mất một khoảng theo số ký tự, các câu xếp hàng nối tiếp.
 * Trạng thái suy ra từ thời điểm đã lưu → chuyển trang / tải lại vẫn giữ tiến trình.
 * Giọng cũ "cần đọc lại" khi lời, kiểu giọng hoặc tốc độ đổi (so khóa băm lúc đọc).
 * TODO(api): thay bằng job TTS ở backend.
 */
import { allShots, loadStoryboards, updateShot, type Shot, type Storyboard, type StoryboardScene, type VoiceRender } from './storyboard-storage'
import { loadVoiceSettings, NARRATOR, voiceSettingFor, type VoiceSetting } from './voice-settings'

export type VoiceKind = 'dialogue' | 'narration'

export type VoiceLine = {
  /** `${shot.id}:${kind}` */
  id: string
  shot: Shot
  kind: VoiceKind
  speaker: string
  /** Cách nói, vd. "khẽ" (chỉ thoại). */
  delivery?: string
  text: string
  chars: number
}

export type VoiceStatus = 'none' | 'queued' | 'generating' | 'ready' | 'outdated'

/* ---------------------------------- Câu đọc ---------------------------------- */

function shotLines(shot: Shot): VoiceLine[] {
  const lines: VoiceLine[] = []
  if (shot.dialogue?.trim()) {
    const text = shot.dialogue.trim()
    lines.push({ id: `${shot.id}:dialogue`, shot, kind: 'dialogue', speaker: shot.character?.trim() || 'Nhân vật', ...(shot.delivery ? { delivery: shot.delivery } : {}), text, chars: text.length })
  }
  if (shot.narration?.trim()) {
    const text = shot.narration.trim()
    lines.push({ id: `${shot.id}:narration`, shot, kind: 'narration', speaker: NARRATOR, text, chars: text.length })
  }
  return lines
}

export const voiceLines = (storyboard: Storyboard) => allShots(storyboard).flatMap(shotLines)

export const sceneVoiceLines = (scene: StoryboardScene) => scene.shots.flatMap(shotLines)

/** Người nói theo thứ tự xuất hiện (Lời dẫn trước), kèm số câu & ký tự. */
export function speakersOf(storyboard: Storyboard) {
  const map = new Map<string, { speaker: string; lines: number; chars: number }>()
  const lines = voiceLines(storyboard)
  for (const line of [...lines.filter((item) => item.kind === 'narration'), ...lines.filter((item) => item.kind === 'dialogue')]) {
    const key = line.speaker.toLocaleLowerCase('vi')
    const entry = map.get(key) ?? { speaker: line.speaker, lines: 0, chars: 0 }
    entry.lines += 1
    entry.chars += line.chars
    map.set(key, entry)
  }
  return [...map.values()]
}

/* -------------------------------- Trạng thái -------------------------------- */

function hash(value: string) {
  let result = 5381
  for (const char of value) result = ((result * 33) ^ char.charCodeAt(0)) >>> 0
  return result.toString(36)
}

/** Khóa của câu với giọng hiện tại – đổi lời / giọng / tốc độ thì khóa đổi. */
export const lineKey = (line: VoiceLine, setting: VoiceSetting) => hash(`${line.text}|${setting.preset}|${setting.speed}`)

export const lineRender = (line: VoiceLine): VoiceRender | undefined => line.shot.voice?.[line.kind]

export function voiceStatus(line: VoiceLine, settings: Record<string, VoiceSetting>, now = Date.now()): VoiceStatus {
  const render = lineRender(line)
  if (!render) return 'none'
  if (now < render.startedAt) return 'queued'
  if (now < render.startedAt + render.durationMs) return 'generating'
  return render.key === lineKey(line, voiceSettingFor(settings, line.speaker)) ? 'ready' : 'outdated'
}

export const voiceProgress = (line: VoiceLine, now = Date.now()) => {
  const render = lineRender(line)
  return render ? Math.min(1, Math.max(0, (now - render.startedAt) / render.durationMs)) : 0
}

/** Câu cần đọc: chưa có giọng hoặc giọng cũ đã lỗi thời. */
export const linesToRead = (storyboard: Storyboard, settings: Record<string, VoiceSetting>, now = Date.now()) =>
  voiceLines(storyboard).filter((line) => {
    const status = voiceStatus(line, settings, now)
    return status === 'none' || status === 'outdated'
  })

const renderEnd = (render: VoiceRender | undefined) => (render ? render.startedAt + render.durationMs : 0)

export const voiceDeadline = (storyboard: Storyboard | undefined) =>
  storyboard ? Math.max(0, ...allShots(storyboard).flatMap((shot) => [renderEnd(shot.voice?.dialogue), renderEnd(shot.voice?.narration)])) : 0

export function voiceStats(storyboard: Storyboard, settings: Record<string, VoiceSetting>, now = Date.now()) {
  const lines = voiceLines(storyboard)
  const statuses = lines.map((line) => voiceStatus(line, settings, now))
  const toRead = lines.filter((_, index) => statuses[index] === 'none' || statuses[index] === 'outdated')
  return {
    total: lines.length,
    chars: lines.reduce((sum, line) => sum + line.chars, 0),
    ready: statuses.filter((status) => status === 'ready').length,
    pending: statuses.filter((status) => status === 'queued' || status === 'generating').length,
    outdated: statuses.filter((status) => status === 'outdated').length,
    toReadChars: toRead.reduce((sum, line) => sum + line.chars, 0),
    secondsLeft: Math.max(0, Math.ceil((voiceDeadline(storyboard) - now) / 1000)),
  }
}

/** Thời gian mô phỏng đọc một câu (theo số ký tự). */
const readMs = (chars: number) => Math.min(6000, 1200 + chars * 45)

/** Xếp hàng đọc các câu (nối tiếp sau các câu đang đọc). */
export function queueVoices(storyboard: Storyboard, lines: VoiceLine[], settings: Record<string, VoiceSetting>, now = Date.now()): Storyboard {
  let cursor = Math.max(now, voiceDeadline(storyboard))
  // Gom theo cú máy (một cú máy có thể có cả thoại lẫn lời dẫn)
  const patches = new Map<number, NonNullable<Shot['voice']>>()
  for (const line of lines) {
    const durationMs = readMs(line.chars)
    const voice = patches.get(line.shot.number) ?? { ...line.shot.voice }
    voice[line.kind] = { startedAt: cursor, durationMs, key: lineKey(line, voiceSettingFor(settings, line.speaker)), chars: line.chars }
    patches.set(line.shot.number, voice)
    cursor += durationMs
  }
  let next = storyboard
  for (const [shotNumber, voice] of patches) next = updateShot(next, shotNumber, { voice }) ?? next
  return next
}

/* ----------------------------- Hạn mức ký tự / ngày ----------------------------- */

const USAGE_KEY = 'storytoscene.voice-usage.v1'
export const VOICE_DAILY_CHAR_LIMIT = 20000

function today() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function usedVoiceCharsToday() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(USAGE_KEY) ?? 'null') as { date?: string; used?: number } | null
    return parsed?.date === today() ? Math.max(0, Number(parsed.used) || 0) : 0
  } catch {
    return 0
  }
}

export const remainingVoiceChars = () => Math.max(0, VOICE_DAILY_CHAR_LIMIT - usedVoiceCharsToday())

/** Trừ ký tự; false nếu không đủ hoặc không ghi được. */
export function consumeVoiceChars(chars: number): boolean {
  const used = usedVoiceCharsToday()
  if (used + chars > VOICE_DAILY_CHAR_LIMIT) return false
  try {
    window.localStorage.setItem(USAGE_KEY, JSON.stringify({ date: today(), used: used + chars }))
    return true
  } catch {
    return false
  }
}

/* ------------------------------ Tải file (mô phỏng) ------------------------------ */

/** Ước lượng thời lượng câu đọc (giây) theo số ký tự & tốc độ. */
export function estimateSeconds(chars: number, setting: VoiceSetting) {
  const perSecond = setting.speed === 'slow' ? 11 : setting.speed === 'fast' ? 18 : 14
  return Math.max(1, Math.round((chars / perSecond) * 10) / 10)
}

/**
 * Tải file .wav giữ chỗ (im lặng, đúng thời lượng ước tính) – chưa có TTS nên không có tiếng thật,
 * nhưng là file âm thanh hợp lệ để thử quy trình dựng.
 */
export function downloadPlaceholderWav(fileName: string, seconds: number) {
  const sampleRate = 8000
  const samples = Math.round(sampleRate * seconds)
  const buffer = new ArrayBuffer(44 + samples)
  const view = new DataView(buffer)
  const writeText = (offset: number, text: string) => [...text].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)))
  writeText(0, 'RIFF')
  view.setUint32(4, 36 + samples, true)
  writeText(8, 'WAVE')
  writeText(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate, true)
  view.setUint16(32, 1, true)
  view.setUint16(34, 8, true) // 8-bit
  writeText(36, 'data')
  view.setUint32(40, samples, true)
  new Uint8Array(buffer, 44).fill(128) // im lặng ở PCM 8-bit
  const url = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Tiến độ lồng tiếng của cả dự án (mọi tập đã có bảng phân cảnh) – cho Sidebar / Tổng quan. */
export function episodeVoiceProgress(projectId: string, scripts: { id: string }[], now = Date.now()) {
  const boards = loadStoryboards(projectId)
  const settings = loadVoiceSettings(projectId)
  const lines = scripts.flatMap((script) => (boards[script.id] ? voiceLines(boards[script.id]) : []))
  return { ready: lines.filter((line) => voiceStatus(line, settings, now) === 'ready').length, total: lines.length }
}
