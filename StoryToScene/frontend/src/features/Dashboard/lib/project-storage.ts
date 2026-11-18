/*
 * ============================================================================
 *  LƯU DỰ ÁN TẠM THỜI BẰNG localStorage (GIẢI PHÁP FRONTEND)
 * ============================================================================
 *  Backend chưa có API dự án, nên danh sách dự án được lưu trong localStorage
 *  của trình duyệt để không mất khi tải lại trang.
 *
 *  Hạn chế: chỉ nằm trên trình duyệt/thiết bị hiện tại, không gắn với tài khoản,
 *  xóa dữ liệu trình duyệt là mất.
 *
 *  TODO(api): khi có API (vd. GET/POST/DELETE /api/projects), thay các hàm
 *  load/save/create bên dưới bằng lời gọi API và bỏ localStorage.
 * ============================================================================
 */
import { settingFields, storyGenres, visualStyles } from '../data/project-catalog'
import type {
  AiLanguage,
  AspectRatio,
  CreateProjectInput,
  Project,
  ProjectSetting,
  ProjectType,
  StoryGenreId,
  VisualStyleId,
} from '../types/project'

const STORAGE_KEY = 'storytoscene.projects.v1'

export function createProject(input: CreateProjectInput): Project {
  const now = new Date().toISOString()
  return { ...input, id: crypto.randomUUID(), chapterCount: 0, scriptCount: 0, createdAt: now, updatedAt: now }
}

/**
 * Áp dữ liệu form vào dự án có sẵn. Giữ nguyên `id`, `createdAt`,
 * số chương / kịch bản; chỉ cập nhật `updatedAt`.
 */
export function updateProject(project: Project, input: CreateProjectInput): Project {
  return {
    ...project,
    ...input,
    id: project.id,
    createdAt: project.createdAt,
    chapterCount: project.chapterCount,
    scriptCount: project.scriptCount,
    updatedAt: new Date().toISOString(),
  }
}

/** Lấy phần dữ liệu form từ dự án đã lưu (để điền sẵn khi chỉnh sửa). */
export function toProjectInput(project: Project): CreateProjectInput {
  const { name, type, genreNote, storyGenreId, visualStyleId, aspectRatio, aiLanguage, setting } = project
  return { name, type, genreNote, storyGenreId, visualStyleId, aspectRatio, aiLanguage, setting }
}

export function loadProjects(): Project[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeProject).filter((project): project is Project => project !== null)
  } catch {
    return []
  }
}

/** Tìm một dự án đã lưu theo ID (dùng cho các màn hình mở theo URL). */
export function findProject(projectId: string | undefined): Project | null {
  if (!projectId) return null
  return loadProjects().find((project) => project.id === projectId) ?? null
}

/** Cập nhật một vài trường của dự án đã lưu (vd. số chương sau khi nhập truyện). */
export function patchProject(projectId: string, patch: Partial<Pick<Project, 'chapterCount' | 'scriptCount'>>) {
  const projects = loadProjects()
  saveProjects(projects.map((project) => (project.id === projectId ? { ...project, ...patch, updatedAt: new Date().toISOString() } : project)))
}

export function saveProjects(projects: Project[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  } catch {
    /* localStorage bị chặn hoặc đầy: vẫn chạy được, chỉ không giữ lại khi tải lại trang */
  }
}

/* ---------------- Kiểm tra dữ liệu đọc từ localStorage (có thể bị sửa tay / cũ) ---------------- */

const isString = (value: unknown): value is string => typeof value === 'string'
const oneOf = <T extends string>(value: unknown, options: readonly T[], fallback: T): T =>
  options.includes(value as T) ? (value as T) : fallback
const idOrNull = <T extends string>(value: unknown, options: readonly { id: T }[]): T | null =>
  options.some((option) => option.id === value) ? (value as T) : null
const count = (value: unknown) => (typeof value === 'number' && value >= 0 ? Math.floor(value) : 0)

function normalizeSetting(value: unknown): ProjectSetting | null {
  if (!value || typeof value !== 'object') return null
  const source = value as Record<string, unknown>
  const setting: ProjectSetting = {}
  for (const { key } of settingFields) {
    const field = source[key]
    if (isString(field) && field.trim()) setting[key] = field.trim()
  }
  return Object.keys(setting).length > 0 ? setting : null
}

function normalizeProject(value: unknown): Project | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (!isString(item.id) || !isString(item.name) || !item.name.trim()) return null

  const createdAt = isString(item.createdAt) && !Number.isNaN(Date.parse(item.createdAt)) ? item.createdAt : new Date().toISOString()

  return {
    id: item.id,
    name: item.name.trim(),
    type: oneOf<ProjectType>(item.type, ['novel', 'script'], 'novel'),
    genreNote: isString(item.genreNote) && item.genreNote.trim() ? item.genreNote.trim() : null,
    storyGenreId: idOrNull<StoryGenreId>(item.storyGenreId, storyGenres),
    visualStyleId: idOrNull<VisualStyleId>(item.visualStyleId, visualStyles),
    aspectRatio: oneOf<AspectRatio>(item.aspectRatio, ['16:9', '9:16'], '16:9'),
    aiLanguage: oneOf<AiLanguage>(item.aiLanguage, ['vi', 'en'], 'vi'),
    setting: normalizeSetting(item.setting),
    chapterCount: count(item.chapterCount),
    scriptCount: count(item.scriptCount),
    createdAt,
    updatedAt: isString(item.updatedAt) ? item.updatedAt : createdAt,
  }
}
