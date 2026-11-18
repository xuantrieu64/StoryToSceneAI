/**
 * Tách chương từ văn bản truyện theo các dòng tiêu đề "Chương N" hoặc "Hồi N".
 *
 * Nhận diện (không phân biệt hoa thường, ở đầu dòng):
 *   Chương 1 · Chương 12: Tên chương · CHƯƠNG IV - Tên · Hồi 3. Tên · hồi 10 – Tên
 * N là số (1, 2, 10…) hoặc số La Mã (I, IV, XII…).
 * Phần văn bản trước tiêu đề chương đầu tiên là "phần mở đầu" và không tạo thành chương.
 */

export type ParsedChapter = {
  /** Thứ tự trong truyện (1, 2, 3…), không phụ thuộc số ghi trên tiêu đề. */
  index: number
  /** Nhãn chuẩn hóa, vd. "Chương 12" hoặc "Hồi IV". */
  label: string
  /** Tên chương sau nhãn (có thể rỗng). */
  title: string
  content: string
  wordCount: number
}

export type ParseResult = {
  chapters: ParsedChapter[]
  /** Số ký tự của phần trước chương đầu tiên (không được nhập). */
  preambleLength: number
}

const HEADING = /^\s*(chương|hồi)\s+(\d{1,4}|[ivxlcdm]{1,8})(?=$|[\s:.\-–—)])\s*[:.\-–—)]?\s*(.*)$/iu

export const countWords = (text: string) => (text.trim() ? text.trim().split(/\s+/u).length : 0)

const capitalize = (word: string) => word.charAt(0).toLocaleUpperCase('vi') + word.slice(1).toLocaleLowerCase('vi')

/** Chuẩn hóa Unicode (văn bản dán từ Word/web có thể ở dạng tổ hợp NFD) và ký tự xuống dòng. */
export const normalizeStoryText = (raw: string) => raw.normalize('NFC').replace(/\r\n?/g, '\n')

export function parseChapters(raw: string): ParseResult {
  const lines = normalizeStoryText(raw).split('\n')
  const chapters: ParsedChapter[] = []
  const preamble: string[] = []
  let current: { label: string; title: string; body: string[] } | null = null

  const flush = () => {
    if (!current) return
    const content = current.body.join('\n').trim()
    chapters.push({ index: chapters.length + 1, label: current.label, title: current.title, content, wordCount: countWords(content) })
  }

  for (const line of lines) {
    const match = HEADING.exec(line)
    if (match) {
      flush()
      const [, kind, number, title] = match
      const label = `${capitalize(kind)} ${/^\d+$/.test(number) ? Number(number) : number.toUpperCase()}`
      current = { label, title: title.trim(), body: [] }
    } else if (current) {
      current.body.push(line)
    } else {
      preamble.push(line)
    }
  }
  flush()

  return { chapters, preambleLength: preamble.join('\n').trim().length }
}
