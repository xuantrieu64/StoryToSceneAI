/*
 * Lập bảng phân cảnh MÔ PHỎNG từ chính nội dung kịch bản của tập (chưa có AI):
 *   Cảnh       → nhóm cảnh, mở đầu bằng một cú máy giới thiệu bối cảnh
 *   Hành động  → cú máy trung cảnh (xen kẽ đứng yên / đẩy chậm vào), kèm nhân vật được nhắc tên
 *   Thoại      → cú máy cận cảnh vào nhân vật nói
 *   Chuyển cảnh→ ghi chú chuyển cảnh của cú máy trước đó
 * Kết quả chỉ phụ thuộc kịch bản nên lập lại cho cùng một tập sẽ ra cùng một bố cục.
 *
 * TODO(api): thay bằng phản hồi của Trợ lý đạo diễn (AI) khi backend sẵn sàng.
 */
import { blocksFromScript, groupByScene, isEmptyBlock, splitParenthetical } from '@/features/script/lib/script-blocks'
import type { Script } from '@/features/script/lib/script-storage'
import type { CameraMove, Shot, Storyboard, StoryboardScene } from './storyboard-storage'

/** Tối đa số cú máy cho một tập (tránh bảng quá dài với kịch bản rất lớn). */
const MAX_SHOTS = 80

const scriptLines = (script: Script) => blocksFromScript(script).filter((block) => !isEmptyBlock(block))

/** Tập có nội dung để lập phân cảnh không. */
export const hasScriptContent = (script: Script) => scriptLines(script).length > 0

function ambience(heading: string) {
  const text = heading.toLocaleLowerCase('vi')
  const sounds: string[] = []
  if (text.includes('mưa')) sounds.push('tiếng mưa rơi')
  if (text.includes('đêm') || text.includes('tối')) sounds.push('không khí đêm tĩnh lặng')
  if (text.includes('phố') || text.includes('đường') || text.includes('chợ')) sounds.push('tiếng xe cộ, người qua lại')
  if (text.includes('biển') || text.includes('sông')) sounds.push('tiếng sóng nước')
  if (text.includes('quán') || text.includes('tiệm') || text.includes('cà phê')) sounds.push('tiếng chuông cửa, tiếng ly tách')
  if (sounds.length === 0) return 'Âm thanh nền của bối cảnh'
  const joined = sounds.join(', ')
  return joined.charAt(0).toLocaleUpperCase('vi') + joined.slice(1)
}

/** Thời lượng ước tính: thoại ~2,5 từ/giây (+1 giây nghỉ), tối thiểu 2 giây. */
const dialogueSeconds = (text: string) => Math.max(2, Math.ceil(text.trim().split(/\s+/).length / 2.5) + 1)
const actionSeconds = (text: string) => Math.min(6, Math.max(3, Math.ceil(text.trim().split(/\s+/).length / 6)))

/** Nhân vật có tên trong một dòng hành động (tên lấy từ người nói trong cả tập). */
function mentionedCharacters(text: string, names: string[]) {
  const lower = text.toLocaleLowerCase('vi')
  return names.filter((name) => lower.includes(name.toLocaleLowerCase('vi')))
}

export function buildStoryboard(script: Script): Storyboard {
  const now = new Date().toISOString()
  const scenes: StoryboardScene[] = []
  const lines = scriptLines(script)
  const names = [...new Set(lines.flatMap((line) => (line.type === 'dialogue' && line.character?.trim() ? [line.character.trim()] : [])))]
  let shotNumber = 0
  let actionCount = 0

  for (const group of groupByScene(lines)) {
    if (shotNumber >= MAX_SHOTS) break
    const heading = group.scene?.text.trim() || (group.number === 0 ? 'Mở đầu' : 'Chưa rõ bối cảnh')
    const shots: Shot[] = []
    const push = (shot: Omit<Shot, 'id' | 'number'>) => {
      if (shotNumber >= MAX_SHOTS) return
      shots.push({ id: crypto.randomUUID(), number: ++shotNumber, ...shot })
    }

    if (group.scene) {
      push({
        size: 'Toàn cảnh',
        movement: 'Lia máy',
        description: `Giới thiệu bối cảnh: ${heading}.`,
        characters: [],
        sound: ambience(heading),
        duration: 3,
      })
    }

    for (const line of group.lines) {
      if (line.type === 'transition') {
        const last = shots[shots.length - 1]
        if (last) last.transition = line.text.trim()
        continue
      }
      if (line.type === 'dialogue') {
        const { note, line: spoken } = splitParenthetical(line.text)
        const character = line.character?.trim() || 'Nhân vật'
        push({
          size: 'Cận cảnh',
          movement: 'Đứng yên',
          description: note ? `${character} (${note}).` : `${character} nói.`,
          characters: [character],
          ...(note ? { delivery: note } : {}),
          character,
          dialogue: spoken.trim(),
          sound: 'Thoại rõ, nền bối cảnh nhỏ',
          duration: dialogueSeconds(spoken),
        })
        continue
      }
      const movement: CameraMove = actionCount++ % 2 === 0 ? 'Đứng yên' : 'Đẩy chậm vào'
      push({
        size: 'Trung cảnh',
        movement,
        description: line.text.trim(),
        characters: mentionedCharacters(line.text, names),
        sound: ambience(heading),
        duration: actionSeconds(line.text),
      })
    }

    if (shots.length > 0) scenes.push({ id: crypto.randomUUID(), number: group.number, heading, shots })
  }

  return { scriptId: script.id, aspectRatio: '16:9', scenes, createdAt: now, updatedAt: now }
}
