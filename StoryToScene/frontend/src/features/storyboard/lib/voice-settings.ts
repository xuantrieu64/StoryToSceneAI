/*
 * Thiết lập giọng đọc theo người nói (nhân vật / Lời dẫn), lưu theo dự án – dùng chung mọi tập.
 * Khóa: `storytoscene.voices.v1.<projectId>` → { [khóa tên]: { preset, speed } }.
 * TODO(api): đồng bộ với danh sách giọng của dịch vụ TTS khi có backend.
 */

export const NARRATOR = 'Lời dẫn'

export const VOICE_PRESETS = ['Người dẫn chuyện', 'Trung tính', 'Nữ dịu dàng', 'Nữ trẻ trung', 'Nữ lớn tuổi', 'Nam trầm ấm', 'Nam trẻ trung', 'Nam lớn tuổi'] as const
export type VoicePreset = (typeof VOICE_PRESETS)[number]

export const VOICE_SPEEDS = [
  { id: 'slow', label: 'Chậm' },
  { id: 'normal', label: 'Vừa' },
  { id: 'fast', label: 'Nhanh' },
] as const
export type VoiceSpeed = (typeof VOICE_SPEEDS)[number]['id']

export type VoiceSetting = { preset: VoicePreset; speed: VoiceSpeed }

const keyFor = (projectId: string) => `storytoscene.voices.v1.${projectId}`

/** Khóa tên: không phân biệt hoa/thường, bỏ khoảng trắng thừa (khớp với tên trong cột Thoại). */
export const speakerKey = (name: string) => name.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi')

export const defaultVoice = (speaker: string): VoiceSetting => ({ preset: speakerKey(speaker) === speakerKey(NARRATOR) ? 'Người dẫn chuyện' : 'Trung tính', speed: 'normal' })

export function loadVoiceSettings(projectId: string): Record<string, VoiceSetting> {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(keyFor(projectId)) ?? '{}')
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
    const result: Record<string, VoiceSetting> = {}
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      const item = value as Partial<VoiceSetting> | null
      if (!item || !VOICE_PRESETS.includes(item.preset as VoicePreset)) continue
      result[key] = { preset: item.preset as VoicePreset, speed: VOICE_SPEEDS.some((speed) => speed.id === item.speed) ? (item.speed as VoiceSpeed) : 'normal' }
    }
    return result
  } catch {
    return {}
  }
}

export const voiceSettingFor = (settings: Record<string, VoiceSetting>, speaker: string) => settings[speakerKey(speaker)] ?? defaultVoice(speaker)

export function saveVoiceSetting(projectId: string, speaker: string, setting: VoiceSetting): boolean {
  try {
    const all = loadVoiceSettings(projectId)
    all[speakerKey(speaker)] = setting
    window.localStorage.setItem(keyFor(projectId), JSON.stringify(all))
    return true
  } catch {
    return false
  }
}

/** Nhân vật đổi tên → chuyển thiết lập giọng sang tên mới. */
export function renameVoiceSetting(projectId: string, oldName: string, newName: string) {
  const all = loadVoiceSettings(projectId)
  const current = all[speakerKey(oldName)]
  if (!current || speakerKey(oldName) === speakerKey(newName)) return
  delete all[speakerKey(oldName)]
  all[speakerKey(newName)] = current
  try {
    window.localStorage.setItem(keyFor(projectId), JSON.stringify(all))
  } catch {
    /* giữ thiết lập cũ */
  }
}
