/*
 * 8 công đoạn sản xuất của một dự án (màn hình Tổng quan & Sidebar).
 * Hiện mới có màn hình Truyện, Trợ lý kịch bản, Kịch bản, Nhân vật, Phân cảnh, Khung hình, Lồng tiếng và Video (`path`); các công đoạn khác chưa triển khai
 * nên không có đường dẫn và hiển thị ở trạng thái chờ.
 */
import { projectPaths } from '@/features/Dashboard/lib/project-display'
import type { Project } from '@/features/Dashboard/types/project'
import { isApproved, loadCharacters } from '@/features/characters/lib/character-storage'
import { loadScripts } from '@/features/script/lib/script-storage'
import { episodeClipProgress } from '@/features/storyboard/lib/clips'
import { episodeFrameProgress } from '@/features/storyboard/lib/frames'
import { storyboardProgress } from '@/features/storyboard/lib/storyboard-storage'
import { episodeVoiceProgress } from '@/features/storyboard/lib/voice'

export type StageId = 'story' | 'scriptAssistant' | 'script' | 'characters' | 'storyboard' | 'frames' | 'voice' | 'video'

export type Stage = {
  id: StageId
  number: number
  title: string
  description: string
  /** Trạng thái hiển thị dựa trên dữ liệu dự án. */
  status: (project: Project) => string
  /** Công đoạn đã hoàn thành chưa (tính tiến độ). */
  isDone: (project: Project) => boolean
  /** Route của màn hình công đoạn; undefined = chưa triển khai. */
  path?: (projectId: string) => string
  /** Nội dung khung "Bước kế tiếp" khi đây là công đoạn tiếp theo. */
  next: { title: string; description: string; cta: string }
}

const never = () => false

export const stages: Stage[] = [
  {
    id: 'story',
    number: 1,
    title: 'Truyện',
    description: 'Dán hoặc tải truyện, tự tách chương.',
    status: (p) => (p.chapterCount > 0 ? `${p.chapterCount} chương` : 'Chưa nhập'),
    isDone: (p) => p.chapterCount > 0,
    path: projectPaths.story,
    next: {
      title: 'Đưa truyện vào dự án',
      description: 'Dán hoặc tải file truyện lên. StoryToScene tự tách chương để bạn chọn chương làm kịch bản.',
      cta: 'Mở Truyện',
    },
  },
  {
    id: 'scriptAssistant',
    number: 2,
    title: 'Trợ lý kịch bản',
    description: 'Trò chuyện để chuyển chương thành tập kịch bản.',
    status: () => 'Chưa bắt đầu',
    isDone: never,
    path: projectPaths.scriptAssistant,
    next: { title: 'Chuyển chương thành kịch bản', description: 'Trò chuyện với trợ lý để chuyển chương truyện thành tập kịch bản.', cta: 'Mở Trợ lý kịch bản' },
  },
  {
    id: 'script',
    number: 3,
    title: 'Kịch bản',
    description: 'Xem và sửa từng tập kịch bản.',
    status: (p) => (p.scriptCount > 0 ? `${p.scriptCount} kịch bản` : 'Chưa có'),
    isDone: (p) => p.scriptCount > 0,
    path: projectPaths.scripts,
    next: { title: 'Hoàn thiện kịch bản', description: 'Xem và sửa từng tập kịch bản.', cta: 'Mở Kịch bản' },
  },
  {
    id: 'characters',
    number: 4,
    title: 'Nhân vật',
    description: 'Tạo ảnh mẫu, duyệt và khóa ngoại hình.',
    status: (p) => {
      const list = loadCharacters(p.id).filter((character) => character.kind === 'character')
      return list.length > 0 ? `${list.filter((character) => isApproved(character)).length}/${list.length} đã duyệt` : 'Chưa có'
    },
    isDone: (p) => {
      const list = loadCharacters(p.id).filter((character) => character.kind === 'character')
      return list.length > 0 && list.every((character) => isApproved(character))
    },
    path: projectPaths.characters,
    next: { title: 'Tạo nhân vật', description: 'Tạo ảnh mẫu, duyệt và khóa ngoại hình nhân vật.', cta: 'Mở Nhân vật' },
  },
  {
    id: 'storyboard',
    number: 5,
    title: 'Phân cảnh',
    description: 'Chia cảnh và cú máy cho từng tập.',
    status: (p) => {
      const { done, total } = storyboardProgress(p.id, loadScripts(p.id))
      return total > 0 ? `${done}/${total} tập` : 'Chưa có'
    },
    isDone: (p) => {
      const { done, total } = storyboardProgress(p.id, loadScripts(p.id))
      return total > 0 && done === total
    },
    path: projectPaths.storyboard,
    next: { title: 'Chia phân cảnh', description: 'Chia cảnh và cú máy cho từng tập.', cta: 'Mở Phân cảnh' },
  },
  {
    id: 'frames',
    number: 6,
    title: 'Khung hình',
    description: 'Tạo hình cho từng cú máy.',
    status: (p) => {
      const { ready, total } = episodeFrameProgress(p.id, loadScripts(p.id))
      return total > 0 ? `${ready}/${total} cú` : 'Chưa có'
    },
    isDone: (p) => {
      const { ready, total } = episodeFrameProgress(p.id, loadScripts(p.id))
      return total > 0 && ready === total
    },
    path: projectPaths.frames,
    next: { title: 'Tạo khung hình', description: 'Tạo hình cho từng cú máy.', cta: 'Mở Khung hình' },
  },
  {
    id: 'voice',
    number: 7,
    title: 'Lồng tiếng',
    description: 'Đọc lời thoại bằng giọng AI.',
    status: (p) => {
      const { ready, total } = episodeVoiceProgress(p.id, loadScripts(p.id))
      return total > 0 ? `${ready}/${total} câu` : 'Chưa có'
    },
    isDone: (p) => {
      const { ready, total } = episodeVoiceProgress(p.id, loadScripts(p.id))
      return total > 0 && ready === total
    },
    path: projectPaths.voice,
    next: { title: 'Lồng tiếng', description: 'Đọc lời thoại bằng giọng AI.', cta: 'Mở Lồng tiếng' },
  },
  {
    id: 'video',
    number: 8,
    title: 'Video',
    description: 'Biến hình thành clip, xem thử cả tập.',
    status: (p) => {
      const { ready, total } = episodeClipProgress(p.id, loadScripts(p.id))
      return total > 0 ? `${ready}/${total} clip` : 'Chưa có'
    },
    isDone: (p) => {
      const { ready, total } = episodeClipProgress(p.id, loadScripts(p.id))
      return total > 0 && ready === total
    },
    path: projectPaths.video,
    next: { title: 'Dựng video', description: 'Biến hình thành clip, xem thử cả tập.', cta: 'Mở Video' },
  },
]

/** Công đoạn tiếp theo = công đoạn đầu tiên chưa xong (null nếu đã xong hết). */
export const nextStage = (project: Project) => stages.find((stage) => !stage.isDone(project)) ?? null

export const completedStageCount = (project: Project) => stages.filter((stage) => stage.isDone(project)).length
