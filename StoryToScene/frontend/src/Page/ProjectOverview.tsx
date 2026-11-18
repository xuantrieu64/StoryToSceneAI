import { useParams } from 'react-router-dom'
import { NextStepCard } from '@/features/project/components/NextStepCard'
import { ProjectLayout } from '@/features/project/components/ProjectLayout'
import { ProjectSummary } from '@/features/project/components/ProjectSummary'
import { StageGrid } from '@/features/project/components/StageGrid'

/** Màn hình Tổng quan dự án (/projects/:projectId) – mở đầu tiên khi bấm thẻ dự án. */
function ProjectOverview() {
  const { projectId } = useParams()

  return (
    <ProjectLayout active="overview" projectId={projectId} title="Tổng quan">
      {(project) => (
        <div className="flex flex-col gap-6">
          <ProjectSummary project={project} />
          <NextStepCard project={project} />
          <StageGrid project={project} />
        </div>
      )}
    </ProjectLayout>
  )
}

export default ProjectOverview
