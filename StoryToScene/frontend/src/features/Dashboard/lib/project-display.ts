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
}
