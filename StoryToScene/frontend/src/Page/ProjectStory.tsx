import { useParams } from 'react-router-dom'
import { ProjectLayout } from '@/features/project/components/ProjectLayout'
import { StoryWorkspace } from '@/features/story/components/StoryWorkspace'

/** Màn hình Truyện (/projects/:projectId/story): nhập bản gốc, tách chương. */
function ProjectStory() {
  const { projectId } = useParams()

  return (
    <ProjectLayout active="story" projectId={projectId} title="Truyện">
      {(project, { reloadProject }) => (
        // key: đổi dự án → nạp lại truyện của đúng dự án đó
        <StoryWorkspace key={project.id} onProjectChange={reloadProject} project={project} />
      )}
    </ProjectLayout>
  )
}

export default ProjectStory
