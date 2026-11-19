/*
 * ============================================================================
 *  LƯU KỊCH BẢN THEO TỪNG DỰ ÁN BẰNG localStorage (GIẢI PHÁP FRONTEND TẠM THỜI)
 * ============================================================================
 *  Mỗi dự án có một khóa riêng: `storytoscene.scripts.v1.<projectId>`, nên kịch bản
 *  của dự án này không bao giờ xuất hiện ở dự án khác. Mặc định: danh sách rỗng.
 *
 *  TODO(api): thay bằng API kịch bản khi backend sẵn sàng.
 * ============================================================================
 */
import { isEmptyBlock, normalizeBlocks, serializeBlocks, summarizeScenes, type ScriptBlock } from './script-blocks'

export type ScriptScene = {
  id: string
  /** Bối cảnh, vd. "Tiệm sách cũ". */
  location: string
  /** Thời gian / không khí, vd. "Đêm mưa". */
  time: string
  /** Tóm tắt diễn biến cảnh. */
  summary: string
}

export type Script = {
  id: string
  /** Số tập (duy nhất trong dự án). */
  episode: number
  title: string
  /** Nội dung kịch bản (nhập tay hoặc đọc từ tệp), tối đa SCRIPT_CONTENT_LIMIT ký tự. */
  content: string
  /** Dòng kịch bản đã biên tập (Cảnh/Hành động/Thoại/Chuyển cảnh); chưa biên tập lần nào = undefined. */
  blocks?: ScriptBlock[]
  scenes: ScriptScene[]
  createdAt: string
  updatedAt: string
}

const keyFor = (projectId: string) => `storytoscene.scripts.v1.${projectId}`

const isString = (value: unknown): value is string => typeof value === 'string'

function normalizeScene(value: unknown): ScriptScene | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (!isString(item.id)) return null
  return {
    id: item.id,
    location: isString(item.location) ? item.location : '',
    time: isString(item.time) ? item.time : '',
    summary: isString(item.summary) ? item.summary : '',
  }
}

function normalizeScript(value: unknown): Script | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (!isString(item.id) || !isString(item.title) || typeof item.episode !== 'number' || item.episode < 1) return null
  const createdAt = isString(item.createdAt) ? item.createdAt : new Date().toISOString()
  return {
    id: item.id,
    episode: Math.floor(item.episode),
    title: item.title,
    content: isString(item.content) ? item.content : '',
    ...(normalizeBlocks(item.blocks) ? { blocks: normalizeBlocks(item.blocks) } : {}),
    scenes: Array.isArray(item.scenes) ? item.scenes.map(normalizeScene).filter((scene): scene is ScriptScene => scene !== null) : [],
    createdAt,
    updatedAt: isString(item.updatedAt) ? item.updatedAt : createdAt,
  }
}

export const byEpisode = (a: Script, b: Script) => a.episode - b.episode

/** Đọc kịch bản của một dự án (rỗng nếu chưa có hoặc dữ liệu hỏng). */
export function loadScripts(projectId: string): Script[] {
  try {
    const raw = window.localStorage.getItem(keyFor(projectId))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeScript).filter((script): script is Script => script !== null).sort(byEpisode)
  } catch {
    return []
  }
}

/** Lưu kịch bản của một dự án. Trả về false nếu trình duyệt từ chối (đầy bộ nhớ / bị chặn). */
export function saveScripts(projectId: string, scripts: Script[]): boolean {
  try {
    window.localStorage.setItem(keyFor(projectId), JSON.stringify(scripts))
    return true
  } catch {
    return false
  }
}

/**
 * Lưu dòng đã biên tập cho đúng một kịch bản (projectId + scriptId); các tập khác giữ nguyên.
 * Bỏ dòng trống, tính lại `content` và `scenes` để thẻ danh sách / file xuất khớp nội dung.
 * Trả về kịch bản đã lưu, hoặc null nếu không tìm thấy / trình duyệt từ chối ghi.
 */
export function saveScriptBlocks(projectId: string, scriptId: string, blocks: ScriptBlock[]): Script | null {
  const scripts = loadScripts(projectId)
  const current = scripts.find((script) => script.id === scriptId)
  if (!current) return null
  const clean = blocks.filter((block) => !isEmptyBlock(block))
  const updated: Script = { ...current, blocks: clean, content: serializeBlocks(clean), scenes: summarizeScenes(clean), updatedAt: new Date().toISOString() }
  return saveScripts(projectId, scripts.map((script) => (script.id === scriptId ? updated : script))) ? updated : null
}

/** Số tập kế tiếp (lớn nhất + 1). */
export const nextEpisode = (scripts: Script[]) => scripts.reduce((max, script) => Math.max(max, script.episode), 0) + 1

/** Giới hạn tên và nội dung khi tạo kịch bản. */
export const SCRIPT_TITLE_LIMIT = 120
export const SCRIPT_CONTENT_LIMIT = 5000

export function createScript(input: { episode: number; title: string; content?: string; scene?: Omit<ScriptScene, 'id'> }): Script {
  const now = new Date().toISOString()
  const scene = input.scene && (input.scene.location || input.scene.time || input.scene.summary) ? input.scene : null
  return {
    id: crypto.randomUUID(),
    episode: input.episode,
    title: input.title,
    content: input.content ?? '',
    scenes: scene ? [{ id: crypto.randomUUID(), ...scene }] : [],
    createdAt: now,
    updatedAt: now,
  }
}

/** Giới hạn mỗi lần thêm hàng loạt để tránh dán nhầm cả cuốn truyện. */
export const BULK_SCRIPT_LIMIT = 100

/** "Tập 3: Tên" / "Tập 3 - Tên" → "Tên" (số tập do hệ thống tự đánh). */
const stripEpisodePrefix = (line: string) => line.replace(/^\s*tập\s*\d+\s*[:.\-–]\s*/iu, '').trim()

/** Mỗi dòng không trống là một tên kịch bản (tối đa 120 ký tự). */
export function parseBulkTitles(text: string) {
  return text
    .split(/\r?\n/)
    .map(stripEpisodePrefix)
    .filter(Boolean)
    .map((title) => title.slice(0, SCRIPT_TITLE_LIMIT))
}

/** Dòng có chữ đầu tiên của nội dung – dùng làm đoạn trích trên thẻ. */
export const contentExcerpt = (content: string) => content.split(/\r?\n/).map((line) => line.trim()).find(Boolean) ?? ''

export const scriptHeading =(script: Script) => `Tập ${script.episode}: ${script.title}`

/** "Cảnh 1. Tiệm sách cũ · Đêm mưa" – phần đầu dòng tóm tắt cảnh. */
export function sceneHeading(scene: ScriptScene, index: number) {
  const place = [scene.location.trim(), scene.time.trim()].filter(Boolean).join(' · ')
  return place ? `Cảnh ${index + 1}. ${place}` : `Cảnh ${index + 1}`
}
