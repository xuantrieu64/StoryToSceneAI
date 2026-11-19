import { useParams } from 'react-router-dom'
import { ProjectLayout } from '@/features/project/components/ProjectLayout'
import { ScriptWorkspace } from '@/features/script/components/ScriptWorkspace'

/** Màn hình Kịch bản (/projects/:projectId/scripts): danh sách tập kịch bản của dự án. */
function ProjectScripts() {
  const { projectId } = useParams()

  return (
    <ProjectLayout active="script" projectId={projectId} title="Kịch bản">
      {(project, { reloadProject }) => (
        // key: đổi dự án → nạp lại kịch bản của đúng dự án đó
        <ScriptWorkspace key={project.id} onProjectChange={reloadProject} project={project} />
      )}
    </ProjectLayout>
  )
}

export default ProjectScripts
