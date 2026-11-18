/*
 * ============================================================================
 *  LƯU TRUYỆN THEO TỪNG DỰ ÁN BẰNG localStorage (GIẢI PHÁP FRONTEND TẠM THỜI)
 * ============================================================================
 *  Mỗi dự án có một khóa riêng: `storytoscene.story.v1.<projectId>`, nên nội dung
 *  của dự án này không bao giờ xuất hiện ở dự án khác.
 *
 *  Giới hạn:
 *   - localStorage thường chỉ khoảng 5 MB cho toàn bộ trang → truyện rất dài có
 *     thể không lưu được (hàm save trả về false để giao diện báo lỗi).
 *   - Chỉ nằm trên trình duyệt/thiết bị hiện tại, không gắn với tài khoản.
 *
 *  TODO(api): thay bằng API lưu bản gốc & chương truyện khi backend sẵn sàng.
 * ============================================================================
 */
import type { ParsedChapter } from './chapter-parser'

const keyFor = (projectId: string) => `storytoscene.story.v1.${projectId}`

/** Chưa nhận diện "Quyển / Tập" → mặc định mọi chương thuộc phần chính văn. */
export const DEFAULT_VOLUME = 'Chính văn'

export type StoryChapter = ParsedChapter & {
  id: string
  /** Tập của chương; dữ liệu cũ chưa có trường này → coi là DEFAULT_VOLUME. */
  volume?: string
}

/** Số chương mỗi trang trong bảng chương. */
export const CHAPTER_PAGE_SIZES = [10, 20, 50] as const

export const chapterVolume = (chapter: StoryChapter) => chapter.volume?.trim() || DEFAULT_VOLUME

/** Đổi số trên nhãn, giữ loại tiêu đề: ("Hồi III", 4) → "Hồi 4"; ("Chương 2", 5) → "Chương 5". */
export function relabelChapter(label: string, number: number) {
  const kind = label.trim().split(/\s+/u)[0] || 'Chương'
  return `${kind} ${number}`
}

export type StoredStory = {
  /** Bản gốc đã lưu ở Bước 1 ("Lưu & Tiếp tục"). */
  source: string
  sourceSavedAt: string | null
  /** Các chương đã xác nhận nhập ở Bước 2. */
  chapters: StoryChapter[]
  importedAt: string | null
}

export const emptyStory: StoredStory = { source: '', sourceSavedAt: null, chapters: [], importedAt: null }

export function loadStory(projectId: string): StoredStory {
  try {
    const raw = window.localStorage.getItem(keyFor(projectId))
    if (!raw) return emptyStory
    const data = JSON.parse(raw) as Partial<StoredStory>
    return {
      source: typeof data.source === 'string' ? data.source : '',
      sourceSavedAt: typeof data.sourceSavedAt === 'string' ? data.sourceSavedAt : null,
      chapters: Array.isArray(data.chapters)
        ? data.chapters.filter((c): c is StoryChapter => !!c && typeof c.id === 'string' && typeof c.label === 'string' && typeof c.content === 'string')
        : [],
      importedAt: typeof data.importedAt === 'string' ? data.importedAt : null,
    }
  } catch {
    return emptyStory
  }
}

/** Lưu truyện của một dự án. Trả về false nếu trình duyệt từ chối (đầy bộ nhớ / bị chặn). */
export function saveStory(projectId: string, story: StoredStory): boolean {
  try {
    window.localStorage.setItem(keyFor(projectId), JSON.stringify(story))
    return true
  } catch {
    return false
  }
}

/** Xóa truyện khi xóa dự án, tránh để lại dữ liệu mồ côi. */
export function removeStory(projectId: string) {
  try {
    window.localStorage.removeItem(keyFor(projectId))
  } catch {
    /* bỏ qua */
  }
}
