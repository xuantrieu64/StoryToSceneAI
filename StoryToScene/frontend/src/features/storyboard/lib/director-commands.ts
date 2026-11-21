/*
 * Hiểu tin nhắn gửi Trợ lý đạo diễn (mô phỏng bằng từ khóa, chưa có AI):
 *   "Lập bảng phân cảnh cho tập này"       → generate
 *   "cú máy 5 đổi sang toàn cảnh"          → editShot (cỡ cảnh và/hoặc chuyển động máy)
 *   "tạo ảnh cả tập" / "tạo lại ảnh cú máy 3" → frames (bước Khung hình)
 *   còn lại                                 → unknown (trợ lý gợi ý cách nhắn)
 * TODO(api): thay bằng phân tích của AI khi backend sẵn sàng.
 */
import type { CameraMove, ShotSize } from './storyboard-storage'

export type DirectorCommand =
  | { kind: 'generate' }
  | { kind: 'frames'; shotNumber?: number }
  | { kind: 'voice' }
  | { kind: 'clips'; shotNumber?: number }
  | { kind: 'export' }
  | { kind: 'editShot'; shotNumber: number; size?: ShotSize; movement?: CameraMove }
  | { kind: 'editShotMissingChange'; shotNumber: number }
  | { kind: 'unknown' }

const normalize = (text: string) => text.normalize('NFC').toLocaleLowerCase('vi').replace(/\s+/g, ' ').trim()

/** Từ khóa → cỡ cảnh / chuyển động (đặt cụm dài trước để "toàn cảnh" không bị "cảnh" nuốt). */
const SIZE_KEYWORDS: [string, ShotSize][] = [
  ['viễn cảnh', 'Viễn cảnh'],
  ['toàn cảnh', 'Toàn cảnh'],
  ['trung cảnh', 'Trung cảnh'],
  ['cận cảnh', 'Cận cảnh'],
  ['cận mặt', 'Cận cảnh'],
  ['đặc tả', 'Đặc tả'],
]
const MOVE_KEYWORDS: [string, CameraMove][] = [
  ['máy tĩnh', 'Đứng yên'],
  ['đứng yên', 'Đứng yên'],
  ['lia', 'Lia máy'],
  ['đẩy', 'Đẩy chậm vào'],
  ['zoom in', 'Đẩy chậm vào'],
  ['kéo', 'Kéo ra'],
  ['zoom out', 'Kéo ra'],
  ['cầm tay', 'Máy cầm tay'],
  ['handheld', 'Máy cầm tay'],
]

const findKeyword = <T,>(text: string, keywords: [string, T][]) => keywords.find(([keyword]) => text.includes(keyword))?.[1]

export function parseDirectorCommand(message: string): DirectorCommand {
  const text = normalize(message)

  const shot = text.match(/(?:cú máy|cú|shot)\s*(?:số\s*)?#?(\d{1,3})/u)

  // Xuất phim / tạo video (clip)
  if (/(xuất phim|xuất video|render phim)/u.test(text)) return { kind: 'export' }
  if (/(video|clip)/u.test(text) && /(tạo|dựng|làm lại|sinh|render)/u.test(text)) {
    return shot ? { kind: 'clips', shotNumber: Number(shot[1]) } : { kind: 'clips' }
  }

  // Lồng tiếng cả tập
  if (/(lồng tiếng|đọc thoại|đọc lời|thu giọng)/u.test(text)) return { kind: 'voice' }

  // Tạo / tạo lại ảnh (khung hình) – xét trước để "tạo lại ảnh cú máy 3" không bị hiểu là sửa cú máy
  if (/(ảnh|khung hình|hình minh họa)/u.test(text) && /(tạo|vẽ|sinh|làm lại|render)/u.test(text)) {
    return shot ? { kind: 'frames', shotNumber: Number(shot[1]) } : { kind: 'frames' }
  }

  if (shot) {
    const shotNumber = Number(shot[1])
    // Chỉ xét phần sau số cú máy để "cú máy 5 …" không bị chính chữ "máy" làm lệch
    const rest = text.slice((shot.index ?? 0) + shot[0].length)
    const size = findKeyword(rest, SIZE_KEYWORDS)
    const movement = findKeyword(rest, MOVE_KEYWORDS)
    if (!size && !movement) return { kind: 'editShotMissingChange', shotNumber }
    return { kind: 'editShot', shotNumber, ...(size ? { size } : {}), ...(movement ? { movement } : {}) }
  }

  const wantsBoard = /(lập|tạo|chia|làm|viết|lên)/u.test(text) && /(phân cảnh|bảng|cú máy|storyboard)/u.test(text)
  if (wantsBoard || text.includes('storyboard')) return { kind: 'generate' }

  return { kind: 'unknown' }
}
