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
  /** Dòng phụ dưới tiêu đề (vd. "0 nhân vật · 0 đã duyệt"). Không truyền = tiêu đề như cũ. */
  subtitle?: (project: Project) => ReactNode
  /** Cụm điều khiển nằm cùng hàng, bên phải tiêu đề (xuống dòng trên màn hình hẹp). */
  actions?: (project: Project) => ReactNode
  /** `reloadProject`: đọc lại dự án đã lưu sau khi màn hình con thay đổi dữ liệu. */
  children: (project: Project, actions: { reloadProject: () => void }) => ReactNode
}

const dashboardPath = siteLinks.studio ?? '/dashboard'

/*
 * ── Quy tắc spacing DUY NHẤT của khu vực dự án ───────────────────────────────
 * Nội dung luôn bắt đầu ngay sau Sidebar với một khoảng cách cố định; không giới hạn max-width,
 * không căn giữa → khoảng cách không phụ thuộc trang đang mở, bề rộng màn hình hay Sidebar đang
 * rộng/hẹp/thu gọn (main là flex-1 nên tự co giãn và dịch theo mép Sidebar).
 * Breadcrumb, tiêu đề và nội dung các trang con nằm chung một cột nên cùng một lề trái.
 * Trang con KHÔNG tự thêm margin/padding ngoài – chỉ xếp nội dung bên trong cột này.
 *   Lề trái (Sidebar → nội dung): 16px · <760px: 12px
 *   Lề phải: 40px · ≤1000px: 28px · <760px: 20px
 *   Lề trên: 28px · <760px: 20px; lề dưới: 40px
 */
const PROJECT_PAGE_SPACING = 'pl-4 pr-10 pb-10 pt-7 max-[1000px]:pr-7 max-[760px]:pl-3 max-[760px]:pr-5 max-[760px]:pt-5'

/** Khung chung cho các màn hình của một dự án: Sidebar (khối "Đang mở"), breadcrumb, tiêu đề. */
export function ProjectLayout({ projectId, active, title, subtitle, actions, children }: ProjectLayoutProps) {
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

      <main className={`min-w-0 flex-1 ${PROJECT_PAGE_SPACING}`}>
        <div className="w-full min-w-0">
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
              {subtitle || actions ? (
                <div className="mb-5 mt-1.5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                  <div className="min-w-0">
                    <h1 className="m-0 text-2xl font-bold leading-8 tracking-[-0.6px] text-[#111827] max-[760px]:text-[22px]">{title}</h1>
                    {subtitle && <p className="mb-0 mt-0.5 text-xs leading-5 text-[#6b7280]">{subtitle(project)}</p>}
                  </div>
                  {actions && <div className="flex min-w-0 flex-wrap items-center gap-2.5">{actions(project)}</div>}
                </div>
              ) : (
                <h1 className="mb-5 mt-1.5 text-2xl font-bold leading-8 tracking-[-0.6px] text-[#111827] max-[760px]:text-[22px]">{title}</h1>
              )}
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
