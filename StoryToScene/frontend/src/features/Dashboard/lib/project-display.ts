import { storyGenres, visualStyles } from '../data/project-catalog'
import type { Project } from '../types/project'

export const projectTypeLabel: Record<Project['type'], string> = {
  novel: 'Tiểu thuyết',
  script: 'Kịch bản',
}

/** Ảnh đại diện: ảnh phong cách đã chọn → ảnh thể loại → null (khung mặc định). */
export function projectCover(project: Project) {
  return (
    visualStyles.find((style) => style.id === project.visualStyleId)?.image ??
    storyGenres.find((genre) => genre.id === project.storyGenreId)?.image ??
    null
  )
}

export const formatProjectDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN')

/** Đường dẫn các màn hình của một dự án (giữ ID dự án trên URL để tải lại vẫn đúng dự án). */
export const projectPaths = {
  overview: (projectId: string) => `/projects/${encodeURIComponent(projectId)}`,
  story: (projectId: string) => `/projects/${encodeURIComponent(projectId)}/story`,
  scriptAssistant: (projectId: string) => `/projects/${encodeURIComponent(projectId)}/script-assistant`,
  scripts: (projectId: string) => `/projects/${encodeURIComponent(projectId)}/scripts`,
  characters: (projectId: string) => `/projects/${encodeURIComponent(projectId)}/characters`,
  storyboard: (projectId: string) => `/projects/${encodeURIComponent(projectId)}/storyboard`,
  frames: (projectId: string) => `/projects/${encodeURIComponent(projectId)}/frames`,
  voice: (projectId: string) => `/projects/${encodeURIComponent(projectId)}/voice`,
  video: (projectId: string) => `/projects/${encodeURIComponent(projectId)}/video`,
  characterDetail: (projectId: string, characterId: string) => `/projects/${encodeURIComponent(projectId)}/characters/${encodeURIComponent(characterId)}`,
  scriptEditor: (projectId: string, scriptId: string) => `/projects/${encodeURIComponent(projectId)}/scripts/${encodeURIComponent(scriptId)}`,
}
