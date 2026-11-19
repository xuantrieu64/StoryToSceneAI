import { blocksFromScript } from '@/features/script/lib/script-blocks'
import type { Script } from '@/features/script/lib/script-storage'

/** Không phân biệt hoa/thường khi gộp trùng; giữ cách viết xuất hiện đầu tiên. */
function uniqueNames(values: string[]) {
  const seen = new Set<string>()
  return values.filter((value) => {
    const key = value.toLocaleLowerCase('vi')
    if (!value || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Gợi ý đặt tên nhân vật từ một tập kịch bản (chỉ đọc, không tạo dữ liệu):
 *  - dialogue: tên người nói trong các dòng Thoại.
 *  - scenes: phần bối cảnh của tiêu đề cảnh, bỏ phần thời gian sau "·" / "–" (vd. "Tiệm sách cũ · Đêm mưa" → "Tiệm sách cũ").
 */
export function characterSuggestions(script: Script | undefined) {
  if (!script) return { dialogue: [], scenes: [] }
  const blocks = blocksFromScript(script)
  return {
    dialogue: uniqueNames(blocks.filter((block) => block.type === 'dialogue').map((block) => (block.character ?? '').trim())),
    scenes: uniqueNames(blocks.filter((block) => block.type === 'scene').map((block) => block.text.split(/\s[·–—-]\s/u)[0].trim())),
  }
}
