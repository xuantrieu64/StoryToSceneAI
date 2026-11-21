/*
 * ============================================================================
 *  NHÂN VẬT CỦA DỰ ÁN (localStorage – GIẢI PHÁP FRONTEND TẠM THỜI)
 * ============================================================================
 *  Khóa riêng cho từng dự án: `storytoscene.characters.v1.<projectId>`.
 *  Mỗi nhân vật gắn với các tập xuất hiện (`episodeIds`, mặc định = tập đang chọn khi tạo).
 *  Tên là định danh: so khớp không phân biệt hoa/thường để trùng với tên trong cột Thoại.
 *  Ảnh xem trước chưa có AI → "đang tạo" được mô phỏng theo thời điểm tạo phiên bản.
 *
 *  TODO(api): thay bằng API nhân vật + tạo ảnh khi backend sẵn sàng.
 * ============================================================================
 */
import type { GenerationTierId } from '../data/generation-tiers'

export type EntityKind = 'character' | 'location' | 'prop'

export type CharacterVersion = {
  id: string
  number: number
  /** Mô tả dùng để tạo phiên bản này. */
  description: string
  tier: GenerationTierId
  createdAt: string
  /**
   * true = ảnh mẫu thật (bấm "Tạo ảnh mẫu" / "Tạo phiên bản" hoặc tải ảnh lên).
   * Bản v1 tạo kèm khi thêm nhân vật chỉ ghi lại mô tả ban đầu, chưa phải ảnh mẫu.
   */
  generated?: boolean
  /** Ảnh người dùng tải lên làm ảnh mẫu (data URL) – có sẵn ngay, không cần chờ tạo. */
  image?: string
}

export type Character = {
  id: string
  kind: EntityKind
  name: string
  /** Mô tả hiện tại (phiên bản mới sẽ tạo từ mô tả này). */
  description: string
  episodeIds: string[]
  versions: CharacterVersion[]
  /** Phiên bản đang dùng cho các cú máy. */
  activeVersionId: string
  /** Khóa ngoại hình xuyên cảnh (= đã duyệt khi bản đang dùng đã tạo xong). */
  lockAppearance: boolean
  createdAt: string
  updatedAt: string
}

export const CHARACTER_NAME_LIMIT = 40
export const CHARACTER_DESCRIPTION_LIMIT = 500
export const MAX_CHARACTER_VERSIONS = 4
/** Thời gian mô phỏng "đang tạo bản xem trước". */
export const GENERATION_MS = 4000

const keyFor = (projectId: string) => `storytoscene.characters.v1.${projectId}`

/** Khóa nhận diện tên: bỏ khoảng trắng thừa, không phân biệt hoa/thường. */
export const nameKey = (name: string) => name.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi')

const isString = (value: unknown): value is string => typeof value === 'string'

function normalizeVersion(value: unknown): CharacterVersion | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (!isString(item.id) || typeof item.number !== 'number' || !isString(item.createdAt)) return null
  return {
    id: item.id,
    number: item.number,
    description: isString(item.description) ? item.description : '',
    tier: item.tier === 'premium' ? 'premium' : 'standard',
    createdAt: item.createdAt,
    // Bản lưu cũ chưa có cờ: mọi bản sau v1 đều do "Tạo phiên bản" sinh ra
    ...(item.generated === true || item.number > 1 || isString(item.image) ? { generated: true } : {}),
    ...(isString(item.image) && item.image.startsWith('data:image/') ? { image: item.image } : {}),
  }
}

function normalizeCharacter(value: unknown): Character | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (!isString(item.id) || !isString(item.name) || !item.name.trim()) return null
  const versions = Array.isArray(item.versions) ? item.versions.map(normalizeVersion).filter((version): version is CharacterVersion => version !== null) : []
  if (versions.length === 0) return null
  const createdAt = isString(item.createdAt) ? item.createdAt : new Date().toISOString()
  return {
    id: item.id,
    kind: item.kind === 'location' || item.kind === 'prop' ? item.kind : 'character',
    name: item.name.trim(),
    description: isString(item.description) ? item.description : '',
    episodeIds: Array.isArray(item.episodeIds) ? item.episodeIds.filter(isString) : [],
    versions: versions.sort((a, b) => a.number - b.number),
    activeVersionId: isString(item.activeVersionId) && versions.some((version) => version.id === item.activeVersionId) ? item.activeVersionId : versions[0].id,
    lockAppearance: item.lockAppearance === true,
    createdAt,
    updatedAt: isString(item.updatedAt) ? item.updatedAt : createdAt,
  }
}

export function loadCharacters(projectId: string): Character[] {
  try {
    const raw = window.localStorage.getItem(keyFor(projectId))
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeCharacter).filter((character): character is Character => character !== null)
  } catch {
    return []
  }
}

/** Trả về false nếu trình duyệt từ chối ghi (đầy bộ nhớ / bị chặn). */
export function saveCharacters(projectId: string, characters: Character[]): boolean {
  try {
    window.localStorage.setItem(keyFor(projectId), JSON.stringify(characters))
    return true
  } catch {
    return false
  }
}

/** Đã có thực thể cùng loại, cùng tên (không tính `exceptId` – dùng khi đổi tên). */
export const findByName = (characters: Character[], kind: EntityKind, name: string, exceptId?: string) =>
  characters.find((character) => character.kind === kind && character.id !== exceptId && nameKey(character.name) === nameKey(name))

export function createCharacter(input: { kind: EntityKind; name: string; description: string; episodeIds: string[] }): Character {
  const now = new Date().toISOString()
  const version: CharacterVersion = { id: crypto.randomUUID(), number: 1, description: input.description, tier: 'standard', createdAt: now }
  return {
    id: crypto.randomUUID(),
    kind: input.kind,
    name: input.name.trim().replace(/\s+/g, ' '),
    description: input.description,
    episodeIds: input.episodeIds,
    versions: [version],
    activeVersionId: version.id,
    lockAppearance: false,
    createdAt: now,
    updatedAt: now,
  }
}

/** Ghi thay đổi cho đúng một nhân vật. Trả về bản đã lưu, hoặc null nếu không tìm thấy / không ghi được. */
export function updateCharacter(projectId: string, characterId: string, update: (character: Character) => Character): Character | null {
  const characters = loadCharacters(projectId)
  const current = characters.find((character) => character.id === characterId)
  if (!current) return null
  const updated = { ...update(current), updatedAt: new Date().toISOString() }
  return saveCharacters(projectId, characters.map((character) => (character.id === characterId ? updated : character))) ? updated : null
}

/**
 * Thêm phiên bản mới (từ mô tả hiện tại). Quá MAX_CHARACTER_VERSIONS → bỏ bản cũ nhất không phải bản đang dùng.
 */
export function withNewVersion(character: Character, tier: GenerationTierId): Character {
  const version: CharacterVersion = {
    id: crypto.randomUUID(),
    number: Math.max(...character.versions.map((item) => item.number)) + 1,
    description: character.description,
    tier,
    createdAt: new Date().toISOString(),
    generated: true,
  }
  return withVersion(character, version, false)
}

/** Thêm ảnh mẫu tải lên (có sẵn ngay) và dùng luôn làm ảnh tham chiếu. */
export function withUploadedSample(character: Character, image: string): Character {
  const version: CharacterVersion = {
    id: crypto.randomUUID(),
    number: Math.max(...character.versions.map((item) => item.number)) + 1,
    description: character.description,
    tier: 'standard',
    createdAt: new Date().toISOString(),
    generated: true,
    image,
  }
  return withVersion(character, version, true)
}

function withVersion(character: Character, version: CharacterVersion, makeActive: boolean): Character {
  let versions = [...character.versions, version]
  while (versions.length > MAX_CHARACTER_VERSIONS) {
    const oldest = versions.find((item) => item.id !== character.activeVersionId)
    if (!oldest) break
    versions = versions.filter((item) => item.id !== oldest.id)
  }
  return { ...character, versions, ...(makeActive ? { activeVersionId: version.id } : {}) }
}

export type VersionStatus = 'generating' | 'ready'
export const versionStatus = (version: CharacterVersion, now = Date.now()): VersionStatus =>
  !version.image && now - Date.parse(version.createdAt) < GENERATION_MS ? 'generating' : 'ready'

/** Các ảnh mẫu của nhân vật (tạo hoặc tải lên), mới nhất trước. */
export const sampleVersions = (character: Character) => character.versions.filter((version) => version.generated).sort((a, b) => b.number - a.number)

/** Ảnh mẫu dùng làm tham chiếu: bản đang dùng nếu là ảnh mẫu, không thì ảnh mẫu đã xong mới nhất. */
export function referenceSample(character: Character, now = Date.now()) {
  const active = activeVersion(character)
  if (active.generated && versionStatus(active, now) === 'ready') return active
  return sampleVersions(character).find((version) => versionStatus(version, now) === 'ready') ?? null
}

export type SampleStatus = 'none' | 'generating' | 'ready'
export function sampleStatus(character: Character, now = Date.now()): SampleStatus {
  if (referenceSample(character, now)) return 'ready'
  return sampleVersions(character).some((version) => versionStatus(version, now) === 'generating') ? 'generating' : 'none'
}

/** Thời điểm phiên bản cuối cùng (trong các nhân vật) tạo xong – mốc dừng đồng hồ của useNow. */
export const generationDeadline = (characters: Character[]) =>
  Math.max(0, ...characters.flatMap((character) => character.versions.map((version) => Date.parse(version.createdAt) + GENERATION_MS)))

export const activeVersion =(character: Character) => character.versions.find((version) => version.id === character.activeVersionId) ?? character.versions[0]

/** Đã duyệt = đã khóa ngoại hình và bản đang dùng đã tạo xong. */
export const isApproved = (character: Character, now = Date.now()) => character.lockAppearance && versionStatus(activeVersion(character), now) === 'ready'

export const KIND_LABELS: Record<EntityKind, string> = { character: 'Nhân vật', location: 'Địa điểm', prop: 'Đạo cụ' }
