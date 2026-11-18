/*
 * Cấu trúc dữ liệu dự án (phía frontend).
 * Lựa chọn được lưu bằng ID cố định, không lưu tên hiển thị.
 * `null` nghĩa là người dùng không chọn → AI tự quyết.
 */

export type ProjectType = 'novel' | 'script'
export type AspectRatio = '16:9' | '9:16'
export type AiLanguage = 'vi' | 'en'

export type VisualStyleId =
  | 'anime-90s'
  | 'chinese-classic'
  | 'flat-2d'
  | 'urban-cinema'
  | 'traditional-ink'
  | 'fantasy-cinema'

export type StoryGenreId =
  | 'hai-huoc'
  | 'thanh-xuan'
  | 'gia-dinh'
  | 'su-thi'
  | 'kinh-di'
  | 'hanh-dong'
  | 'trinh-tham'
  | 'tien-hiep'

/** 8 trường bối cảnh. Trường để trống thì không lưu. */
export type ProjectSetting = {
  era?: string
  location?: string
  people?: string
  costume?: string
  architecture?: string
  signage?: string
  dailyLife?: string
  forbidden?: string
}

export type ProjectSettingKey = keyof ProjectSetting

/** Dữ liệu thu thập từ form "Dự án mới" (payload dự kiến cho POST /api/projects). */
export type CreateProjectInput = {
  name: string
  type: ProjectType
  /** Ô nhập tự do "Ghi chú thể loại". */
  genreNote: string | null
  storyGenreId: StoryGenreId | null
  visualStyleId: VisualStyleId | null
  aspectRatio: AspectRatio
  aiLanguage: AiLanguage
  /** null = AI tự theo truyện. */
  setting: ProjectSetting | null
}

export type Project = CreateProjectInput & {
  id: string
  chapterCount: number
  scriptCount: number
  createdAt: string
  updatedAt: string
}

export const PROJECT_NAME_MAX_LENGTH = 120

/** Hạn mức số dự án hiện tại. */
export const PROJECT_LIMIT = 1
