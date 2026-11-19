import { useParams } from 'react-router-dom'
import { ProjectLayout } from '@/features/project/components/ProjectLayout'
import { ScriptAssistantWorkspace } from '@/features/script-assistant/components/ScriptAssistantWorkspace'

/** Màn hình Trợ lý kịch bản (/projects/:projectId/script-assistant): chat + khung truyện/kịch bản. */
function ScriptAssistant() {
  const { projectId } = useParams()

  return (
    <ProjectLayout active="scriptAssistant" projectId={projectId} title="Trợ lý kịch bản">
      {(project) => <ScriptAssistantWorkspace key={project.id} />}
    </ProjectLayout>
  )
}

export default ScriptAssistant
