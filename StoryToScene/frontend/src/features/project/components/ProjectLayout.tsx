import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { siteLinks } from '@/config/site-links'
import { projectCover, projectPaths } from '@/features/Dashboard/lib/project-display'
import { findProject } from '@/features/Dashboard/lib/project-storage'
import { Sidebar, type OpenProjectNav } from '@/features/Dashboard/Sidebar/Sidebar'
import { TutorialPanel } from '@/features/Dashboard/TutorialPanel/TutorialPanel'
import type { Project } from '@/features/Dashboard/types/project'
import { stages, type StageId } from '../data/stages'

type ProjectLayoutProps = {
  /** ID dự án lấy từ URL – tải lại trang vẫn mở đúng dự án. */
  projectId: string | undefined
  active: 'overview' | StageId
  title: string
  /** `reloadProject`: đọc lại dự án đã lưu sau khi màn hình con thay đổi dữ liệu. */
  children: (project: Project, actions: { reloadProject: () => void }) => ReactNode
}

const dashboardPath = siteLinks.studio ?? '/dashboard'

/** Khung chung cho các màn hình của một dự án: Sidebar (khối "Đang mở"), breadcrumb, tiêu đề. */
export function ProjectLayout({ projectId, active, title, children }: ProjectLayoutProps) {
  const [guideOpen, setGuideOpen] = useState(false)
  // `version` tăng khi màn hình con báo dữ liệu đổi → render lại và đọc dự án mới nhất.
  const [, setVersion] = useState(0)
  // Dữ liệu tạm lưu ở localStorage (xem Dashboard/lib/project-storage.ts); đọc theo ID trên URL.
  const project = findProject(projectId)

  const openProject: OpenProjectNav | undefined = project
    ? {
        name: project.name,
        cover: projectCover(project),
        items: [
          { key: 'overview', label: 'Tổng quan', href: projectPaths.overview(project.id), active: active === 'overview' },
          ...stages.map((stage) => ({
            key: stage.id,
            number: stage.number,
            label: stage.title,
            status: stage.status(project),
            href: stage.path?.(project.id),
            active: active === stage.id,
          })),
        ],
      }
    : undefined

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] font-sans text-[#111827]">
      <Sidebar activeItem={null} guideOpen={guideOpen} onOpenGuide={() => setGuideOpen(true)} openProject={openProject} />

      <main className="min-w-0 flex-1 px-10 pb-10 pt-7 max-[1000px]:px-7 max-[760px]:px-5 max-[760px]:pt-5">
        <div className="mx-auto max-w-[1180px]">
          {project ? (
            <>
              <nav aria-label="Breadcrumb" className="text-xs leading-5 text-[#6b7280]">
                <ol className="m-0 flex list-none flex-wrap items-center gap-1.5 p-0">
                  <li>
                    <Link className="hover:text-[#39b536] hover:underline" to={dashboardPath}>
                      Dự án của tôi
                    </Link>
                  </li>
                  <Chevron />
                  {active === 'overview' ? (
                    <li aria-current="page" className="max-w-[320px] truncate text-[#374151]">
                      {project.name}
                    </li>
                  ) : (
                    <>
                      <li className="max-w-[240px] truncate">
                        <Link className="hover:text-[#39b536] hover:underline" to={projectPaths.overview(project.id)}>
                          {project.name}
                        </Link>
                      </li>
                      <Chevron />
                      <li aria-current="page" className="text-[#374151]">
                        {title}
                      </li>
                    </>
                  )}
                </ol>
              </nav>
              <h1 className="mb-5 mt-1.5 text-2xl font-bold leading-8 tracking-[-0.6px] text-[#111827] max-[760px]:text-[22px]">{title}</h1>
              {children(project, { reloadProject: () => setVersion((value) => value + 1) })}
            </>
          ) : (
            <ProjectNotFound />
          )}
        </div>
      </main>

      <TutorialPanel open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  )
}

function ProjectNotFound() {
  return (
    <div className="mt-10 grid min-h-[360px] place-items-center rounded-xl border border-dashed border-[#d1d5db] bg-white/40 p-8 text-center">
      <div>
        <h1 className="m-0 text-base font-bold leading-6 text-[#111827]">Không tìm thấy dự án</h1>
        <p className="mb-4 mt-1.5 text-xs leading-5 text-[#6b7280]">Dự án có thể đã bị xóa hoặc đường dẫn không đúng.</p>
        <Link
          className="inline-flex min-h-[38px] items-center rounded-lg bg-[#39b536] px-4 text-xs text-white shadow-sm hover:bg-[#32a92f]"
          to={dashboardPath}
        >
          Về Dự án của tôi
        </Link>
      </div>
    </div>
  )
}

function Chevron() {
  return (
    <li aria-hidden="true" className="text-[#9ca3af]">
      <svg className="size-3" fill="none" viewBox="0 0 12 12">
        <path d="m4.5 2.5 3 3.5-3 3.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      </svg>
    </li>
  )
}
