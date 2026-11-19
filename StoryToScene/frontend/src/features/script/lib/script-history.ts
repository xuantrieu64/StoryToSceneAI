/*
 * ============================================================================
 *  LỊCH SỬ BẢN LƯU CỦA MỘT TẬP KỊCH BẢN (localStorage – GIẢI PHÁP FRONTEND TẠM THỜI)
 * ============================================================================
 *  Khóa riêng cho từng tập: `storytoscene.script-history.v1.<projectId>.<scriptId>`,
 *  nên lịch sử của tập/dự án này không bao giờ lẫn sang tập/dự án khác.
 *  Giữ tối đa HISTORY_LIMIT bản mới nhất (mới nhất đứng đầu).
 *
 *  Trang Biên tập tự lưu sau mỗi dòng sửa → các lần sửa liên tiếp trong cùng một lần mở
 *  trang (cách nhau < COALESCE_MS) được gộp vào một bản để 20 bản không hết sau vài phút.
 *
 *  TODO(api): thay bằng API phiên bản khi backend sẵn sàng.
 * ============================================================================
 */
import { countCharacters, normalizeBlocks, serializeBlocks, type ScriptBlock } from './script-blocks'

export type VersionSource = 'manual' | 'assistant' | 'restore'

export type ScriptVersion = {
  id: string
  /** Số phiên bản tăng dần trong tập (v1, v2…), không dùng lại kể cả khi bản cũ bị cắt bớt. */
  number: number
  source: VersionSource
  /** Khôi phục từ phiên bản số mấy (chỉ với source = 'restore'). */
  restoredFrom?: number
  savedAt: string
  blocks: ScriptBlock[]
  charCount: number
  /** Lần mở trang Biên tập đã tạo bản này (để gộp các lần tự lưu liên tiếp). */
  sessionId?: string
}

export const HISTORY_LIMIT = 20
const COALESCE_MS = 3 * 60 * 1000

const keyFor = (projectId: string, scriptId: string) => `storytoscene.script-history.v1.${projectId}.${scriptId}`

export function versionLabel(version: ScriptVersion) {
  if (version.source === 'assistant') return 'Trợ lý kịch bản'
  if (version.source === 'restore') return version.restoredFrom ? `Khôi phục từ v${version.restoredFrom}` : 'Khôi phục'
  return 'Bạn lưu'
}

const sameContent = (a: ScriptBlock[], b: ScriptBlock[]) => serializeBlocks(a) === serializeBlocks(b)

function normalizeVersion(value: unknown): ScriptVersion | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  const blocks = normalizeBlocks(item.blocks)
  if (typeof item.id !== 'string' || typeof item.number !== 'number' || typeof item.savedAt !== 'string' || !blocks) return null
  const source: VersionSource = item.source === 'assistant' || item.source === 'restore' ? item.source : 'manual'
  return {
    id: item.id,
    number: item.number,
    source,
    ...(typeof item.restoredFrom === 'number' ? { restoredFrom: item.restoredFrom } : {}),
    savedAt: item.savedAt,
    blocks,
    charCount: countCharacters(blocks),
    ...(typeof item.sessionId === 'string' ? { sessionId: item.sessionId } : {}),
  }
}

/** Lịch sử của một tập, mới nhất đứng đầu. */
export function loadHistory(projectId: string, scriptId: string): ScriptVersion[] {
  try {
    const raw = window.localStorage.getItem(keyFor(projectId, scriptId))
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeVersion).filter((version): version is ScriptVersion => version !== null).sort((a, b) => b.number - a.number)
  } catch {
    return []
  }
}

/** Ghi lịch sử; nếu bộ nhớ đầy thì bỏ dần bản cũ nhất cho tới khi ghi được (luôn giữ bản mới nhất). */
function saveHistory(projectId: string, scriptId: string, versions: ScriptVersion[]): ScriptVersion[] {
  let list = versions.slice(0, HISTORY_LIMIT)
  while (list.length > 0) {
    try {
      window.localStorage.setItem(keyFor(projectId, scriptId), JSON.stringify(list))
      return list
    } catch {
      if (list.length === 1) break
      list = list.slice(0, -1)
    }
  }
  return list
}

type RecordOptions = { source: VersionSource; sessionId?: string; restoredFrom?: number; savedAt?: string }

/**
 * Ghi một bản lưu cho tập (gọi sau khi nội dung đã được lưu). Không đổi nội dung → không tạo bản mới.
 * Trả về lịch sử mới (mới nhất đứng đầu).
 * Trợ lý kịch bản dùng `{ source: 'assistant' }` khi ghi nội dung vào tập.
 */
export function recordVersion(projectId: string, scriptId: string, blocks: ScriptBlock[], options: RecordOptions): ScriptVersion[] {
  const history = loadHistory(projectId, scriptId)
  const latest = history[0]
  if (latest && options.source !== 'restore' && sameContent(latest.blocks, blocks)) return history

  const now = options.savedAt ?? new Date().toISOString()
  const snapshot = blocks.map((block) => ({ ...block }))
  const coalesce =
    latest &&
    options.source === 'manual' &&
    latest.source === 'manual' &&
    options.sessionId !== undefined &&
    latest.sessionId === options.sessionId &&
    Date.parse(now) - Date.parse(latest.savedAt) < COALESCE_MS

  const next: ScriptVersion[] = coalesce
    ? [{ ...latest, blocks: snapshot, charCount: countCharacters(snapshot), savedAt: now }, ...history.slice(1)]
    : [
        {
          id: crypto.randomUUID(),
          number: (latest?.number ?? 0) + 1,
          source: options.source,
          ...(options.restoredFrom ? { restoredFrom: options.restoredFrom } : {}),
          savedAt: now,
          blocks: snapshot,
          charCount: countCharacters(snapshot),
          ...(options.sessionId ? { sessionId: options.sessionId } : {}),
        },
        ...history,
      ]
  return saveHistory(projectId, scriptId, next)
}

/** Tập chưa có lịch sử → tạo v1 từ nội dung hiện có (thời điểm = lần cập nhật cuối của tập). */
export function ensureBaseline(projectId: string, scriptId: string, blocks: ScriptBlock[], savedAt: string): ScriptVersion[] {
  const history = loadHistory(projectId, scriptId)
  if (history.length > 0 || blocks.length === 0) return history
  return recordVersion(projectId, scriptId, blocks, { source: 'manual', savedAt })
}

/** Xóa lịch sử khi xóa tập, tránh để lại dữ liệu mồ côi. */
export function removeScriptHistory(projectId: string, scriptId: string) {
  try {
    window.localStorage.removeItem(keyFor(projectId, scriptId))
  } catch {
    /* bỏ qua */
  }
}

/** "21:14 22-10" (thêm năm nếu khác năm hiện tại). */
export function formatVersionTime(iso: string) {
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  const base = `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(date.getDate())}-${pad(date.getMonth() + 1)}`
  return date.getFullYear() === new Date().getFullYear() ? base : `${base}-${date.getFullYear()}`
}
