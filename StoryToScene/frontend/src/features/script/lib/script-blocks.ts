/*
 * Kịch bản dạng dòng (dùng cho trang Biên tập):
 *   Cảnh · Hành động · Thoại · Chuyển cảnh.
 * Kịch bản cũ chỉ có `content` (văn bản) hoặc `scenes` được chuyển sang dòng khi mở lần đầu;
 * sau khi sửa, `content`/`scenes` được tính lại từ dòng để thẻ danh sách & file xuất khớp nội dung.
 */
import type { Script, ScriptScene } from './script-storage'

export type BlockType = 'scene' | 'action' | 'dialogue' | 'transition'

export type ScriptBlock = {
  id: string
  type: BlockType
  /** Cảnh: bối cảnh (vd. "Tiệm sách cũ · Đêm mưa"); Thoại: lời thoại, có thể mở đầu bằng "(khẽ)". */
  text: string
  /** Chỉ dùng cho Thoại. */
  character?: string
}

export const BLOCK_TYPES: BlockType[] = ['scene', 'action', 'dialogue', 'transition']

export const BLOCK_LABELS: Record<BlockType, string> = {
  scene: 'Cảnh',
  action: 'Hành động',
  dialogue: 'Thoại',
  transition: 'Chuyển cảnh',
}

/** Giới hạn ký tự của toàn bộ kịch bản trong trang Biên tập. */
export const SCRIPT_EDITOR_LIMIT = 50000

export function createBlock(type: BlockType, text = '', character = ''): ScriptBlock {
  return type === 'dialogue' ? { id: crypto.randomUUID(), type, text, character } : { id: crypto.randomUUID(), type, text }
}

/** Đổi loại dòng, giữ nguyên nội dung. */
export function convertBlock(block: ScriptBlock, type: BlockType): ScriptBlock {
  if (type === 'dialogue') return { id: block.id, type, text: block.text, character: block.character ?? '' }
  return { id: block.id, type, text: block.text }
}

export const isEmptyBlock = (block: ScriptBlock) => !block.text.trim() && !(block.character ?? '').trim()

/** Dòng mới khi nhấn Enter: sau Cảnh là Hành động, sau Chuyển cảnh là Cảnh, còn lại giữ loại. */
export const nextTypeAfter = (type: BlockType): BlockType => (type === 'scene' ? 'action' : type === 'transition' ? 'scene' : type)

/* ------------------------------ Văn bản ⇄ dòng ------------------------------ */

const SCENE_RE = /^(?:cảnh|canh)\s*\d+\s*[.:\-–—]?\s*(.*)$/iu
const SLUGLINE_RE = /^(?:int|ext|nội|ngoại)[.\s/]/iu
const TRANSITION_RE = /^(?:chuyển cảnh|cắt sang|cắt cảnh|mờ dần|mờ vào|cut to|fade (?:in|out|to)|dissolve to)(?=[\s:.]|$)/iu
/** "LAN: …" hoặc "Bà Hạnh (khẽ): …" – tên ≤ 4 từ, viết hoa chữ đầu. */
const DIALOGUE_RE = /^([^:：()\d]{1,32}?)\s*(\([^)]*\))?\s*[:：]\s*(.+)$/u

function parseLine(line: string): ScriptBlock {
  const scene = line.match(SCENE_RE)
  if (scene) return createBlock('scene', scene[1].trim())
  if (SLUGLINE_RE.test(line)) return createBlock('scene', line)
  if (TRANSITION_RE.test(line)) return createBlock('transition', line)
  const dialogue = line.match(DIALOGUE_RE)
  if (dialogue) {
    const name = dialogue[1].trim()
    if (/^\p{Lu}/u.test(name) && name.split(/\s+/).length <= 4) {
      return createBlock('dialogue', dialogue[2] ? `${dialogue[2]} ${dialogue[3].trim()}` : dialogue[3].trim(), name)
    }
  }
  return createBlock('action', line)
}

/** Văn bản kịch bản → dòng (mỗi dòng không trống là một dòng kịch bản). */
export function parseScriptText(text: string): ScriptBlock[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseLine)
}

/** Dòng → văn bản (định dạng parseScriptText đọc lại được). */
export function serializeBlocks(blocks: ScriptBlock[]) {
  let sceneNumber = 0
  return blocks
    .map((block) => {
      if (block.type === 'scene') return `CẢNH ${++sceneNumber}. ${block.text.trim()}`.trim()
      if (block.type === 'dialogue') return `${(block.character ?? '').trim() || 'NHÂN VẬT'}: ${block.text.trim()}`
      return block.text.trim()
    })
    .join('\n')
}

/** Số ký tự của kịch bản (theo văn bản đã chuẩn hoá). */
export const countCharacters = (blocks: ScriptBlock[]) => serializeBlocks(blocks.filter((block) => !isEmptyBlock(block))).length

/** Dòng của một kịch bản: ưu tiên `blocks`, nếu chưa có thì chuyển từ `scenes` + `content`. */
export function blocksFromScript(script: Script): ScriptBlock[] {
  if (script.blocks) return script.blocks
  const fromScenes = script.scenes.flatMap((scene) => [
    createBlock('scene', [scene.location.trim(), scene.time.trim()].filter(Boolean).join(' · ')),
    ...(scene.summary.trim() ? [createBlock('action', scene.summary.trim())] : []),
  ])
  return [...fromScenes, ...parseScriptText(script.content)]
}

/* ---------------------------------- Nhóm cảnh ---------------------------------- */

export type SceneGroup = {
  /** null = các dòng nằm trước cảnh đầu tiên. */
  scene: ScriptBlock | null
  number: number
  lines: ScriptBlock[]
}

export function groupByScene(blocks: ScriptBlock[]): SceneGroup[] {
  const groups: SceneGroup[] = []
  let sceneNumber = 0
  for (const block of blocks) {
    if (block.type === 'scene') groups.push({ scene: block, number: ++sceneNumber, lines: [] })
    else if (groups.length === 0) groups.push({ scene: null, number: 0, lines: [block] })
    else groups[groups.length - 1].lines.push(block)
  }
  return groups
}

export const countType = (blocks: ScriptBlock[], type: BlockType) => blocks.filter((block) => block.type === type).length

/** `scenes` tóm tắt (cho thẻ danh sách): bối cảnh + hành động đầu tiên của mỗi cảnh. */
export function summarizeScenes(blocks: ScriptBlock[]): ScriptScene[] {
  return groupByScene(blocks)
    .filter((group) => group.scene)
    .map((group) => ({
      id: group.scene!.id,
      location: group.scene!.text,
      time: '',
      summary: group.lines.find((line) => line.type === 'action')?.text ?? '',
    }))
}

/** Tách "(khẽ) Lời thoại" → { note: "khẽ", line: "Lời thoại" }. */
export function splitParenthetical(text: string) {
  const match = text.match(/^\s*\(([^)]*)\)\s*(.*)$/su)
  return match ? { note: match[1].trim(), line: match[2] } : { note: '', line: text }
}

/** Kiểm tra một giá trị đọc từ bộ nhớ có phải dòng kịch bản hợp lệ. */
export function normalizeBlocks(value: unknown): ScriptBlock[] | undefined {
  if (!Array.isArray(value)) return undefined
  return value.flatMap((item): ScriptBlock[] => {
    if (!item || typeof item !== 'object') return []
    const raw = item as Record<string, unknown>
    if (typeof raw.id !== 'string' || typeof raw.text !== 'string' || !BLOCK_TYPES.includes(raw.type as BlockType)) return []
    const type = raw.type as BlockType
    return [type === 'dialogue' ? { id: raw.id, type, text: raw.text, character: typeof raw.character === 'string' ? raw.character : '' } : { id: raw.id, type, text: raw.text }]
  })
}
