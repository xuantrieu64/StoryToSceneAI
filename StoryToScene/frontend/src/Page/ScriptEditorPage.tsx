import { Link, useParams } from 'react-router-dom'
import { projectPaths } from '@/features/Dashboard/lib/project-display'
import { ProjectLayout } from '@/features/project/components/ProjectLayout'
import { ScriptEditor } from '@/features/script/components/editor/ScriptEditor'
import { loadScripts } from '@/features/script/lib/script-storage'

/** Màn hình Biên tập một tập (/projects/:projectId/scripts/:scriptId). */
function ScriptEditorPage() {
  const { projectId, scriptId } = useParams()

  return (
    <ProjectLayout active="script" projectId={projectId} title="Kịch bản">
      {(project) => {
        // Đọc theo đúng dự án trên URL – tập của dự án khác không bao giờ mở được ở đây
        const scripts = loadScripts(project.id)
        const script = scripts.find((item) => item.id === scriptId)
        return script ? (
          // key: chuyển tập → nạp lại nội dung của đúng tập đó
          <ScriptEditor key={script.id} projectId={project.id} script={script} scripts={scripts} />
        ) : (
          <div className="grid min-h-[360px] place-items-center rounded-xl border border-dashed border-[#d1d5db] bg-white/40 p-8 text-center">
            <div>
              <h2 className="m-0 text-base font-bold leading-6 text-[#111827]">Không tìm thấy tập kịch bản</h2>
              <p className="mb-4 mt-1.5 text-xs leading-5 text-[#6b7280]">Tập có thể đã bị xóa hoặc thuộc dự án khác.</p>
              <Link
                className="inline-flex min-h-[38px] items-center rounded-lg bg-[#39b536] px-4 text-xs text-white shadow-sm hover:bg-[#32a92f]"
                to={projectPaths.scripts(project.id)}
              >
                Về danh sách kịch bản
              </Link>
            </div>
          </div>
        )
      }}
    </ProjectLayout>
  )
}

export default ScriptEditorPage
