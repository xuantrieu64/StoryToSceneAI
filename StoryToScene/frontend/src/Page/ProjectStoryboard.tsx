import { useParams } from 'react-router-dom'
import { ProjectLayout } from '@/features/project/components/ProjectLayout'
import { loadScripts } from '@/features/script/lib/script-storage'
import { StoryboardWorkspace } from '@/features/storyboard/components/StoryboardWorkspace'
import { episodeClipProgress } from '@/features/storyboard/lib/clips'
import { episodeFrameProgress } from '@/features/storyboard/lib/frames'
import { storyboardProgress } from '@/features/storyboard/lib/storyboard-storage'
import { episodeVoiceProgress } from '@/features/storyboard/lib/voice'

type ProjectStoryboardProps = {
  /** storyboard: mục 5 Phân cảnh (/storyboard) · frames: mục 6 Khung hình (/frames) · voice: mục 7 Lồng tiếng (/voice) · video: mục 8 Video (/video). */
  mode?: 'storyboard' | 'frames' | 'voice' | 'video'
}

/**
 * Một màn hình cho các bước liên tiếp: mục 5 Phân cảnh, mục 6 Khung hình, mục 7 Lồng tiếng, mục 8 Video.
 * Các route dùng chung component, phiên trợ lý và dữ liệu bảng phân cảnh; chỉ khác tab kết quả đang mở
 * và mục được đánh dấu trên Sidebar.
 */
function ProjectStoryboard({ mode = 'storyboard' }: ProjectStoryboardProps) {
  const { projectId } = useParams()

  return (
    <ProjectLayout
      active={mode}
      projectId={projectId}
      subtitle={(project) => {
        const scripts = loadScripts(project.id)
        if (scripts.length === 0) return 'Chưa có tập kịch bản'
        if (mode === 'video') {
          const { ready, total } = episodeClipProgress(project.id, scripts)
          return total > 0 ? `${ready}/${total} cú máy đã có clip` : 'Chưa có bảng phân cảnh để dựng video'
        }
        if (mode === 'voice') {
          const { ready, total } = episodeVoiceProgress(project.id, scripts)
          return total > 0 ? `${ready}/${total} câu đã có giọng` : 'Chưa có lời thoại để lồng tiếng'
        }
        if (mode === 'frames') {
          const { ready, total } = episodeFrameProgress(project.id, scripts)
          return total > 0 ? `${ready}/${total} cú máy đã có khung hình` : 'Chưa có bảng phân cảnh để tạo khung hình'
        }
        const { done, total } = storyboardProgress(project.id, scripts)
        return `${done}/${total} tập đã có bảng phân cảnh`
      }}
      title={{ storyboard: 'Phân cảnh', frames: 'Khung hình', voice: 'Lồng tiếng', video: 'Video' }[mode]}
    >
      {(project, { reloadProject }) => <StoryboardWorkspace key={project.id} mode={mode} onStoryboardsChange={reloadProject} projectId={project.id} />}
    </ProjectLayout>
  )
}

export default ProjectStoryboard
