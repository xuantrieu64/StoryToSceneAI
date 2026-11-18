import { useState } from 'react'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Menu } from '@base-ui/react/menu'
import { Link } from 'react-router-dom'
import { findOptionName, storyGenres, visualStyles } from '../data/project-catalog'
import { formatProjectDate, projectCover, projectPaths, projectTypeLabel } from '../lib/project-display'
import { BrandIcon } from '../Sidebar/Sidebar'
import type { Project } from '../types/project'

type ProjectCardProps = {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (project: Project) => void
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const cover = projectCover(project)
  const genreName = findOptionName(storyGenres, project.storyGenreId)
  const styleName = findOptionName(visualStyles, project.visualStyleId)
  const subtitle = [genreName, styleName].filter(Boolean).join(' · ') || 'AI tự quyết thể loại & phong cách'

  return (
    <article
      aria-labelledby={`project-${project.id}-name`}
      className="relative flex flex-col overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow focus-within:ring-2 focus-within:ring-[#39b536]/40 hover:shadow-md"
    >
      <div className="relative aspect-[16/9] w-full shrink-0 bg-[#f3f4f6]">
        {cover ? (
          <img alt="" className="absolute inset-0 size-full object-cover" decoding="async" loading="lazy" src={cover} />
        ) : (
          <span aria-hidden="true" className="absolute inset-0 grid place-items-center bg-[linear-gradient(135deg,#f3faf2_0%,#eaf7e9_100%)]">
            <BrandIcon />
          </span>
        )}

        <div className="absolute left-2.5 top-2.5 flex items-center gap-1.5">
          <span className="rounded-md bg-[#39b536] px-2 py-0.5 text-[11px] font-medium leading-4 text-white">
            {projectTypeLabel[project.type]}
          </span>
          <span className="rounded-md bg-black/45 px-2 py-0.5 text-[11px] font-medium leading-4 text-white backdrop-blur-sm">
            {project.aspectRatio}
          </span>
        </div>

        <Menu.Root>
          <Menu.Trigger
            aria-label={`Thao tác với dự án ${project.name}`}
            className="absolute right-2.5 top-2.5 z-10 grid size-6 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]"
          >
            <DotsIcon />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner align="end" className="z-30" sideOffset={6}>
              <Menu.Popup className="min-w-[160px] rounded-lg border border-[#e5e7eb] bg-white p-1 text-[13px] shadow-lg outline-none">
                <Menu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-[#374151] outline-none data-[highlighted]:bg-gray-50"
                  onClick={() => onEdit(project)}
                >
                  <PencilIcon />
                  Chỉnh sửa dự án
                </Menu.Item>
                <Menu.Item
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-[#dc2626] outline-none data-[highlighted]:bg-red-50"
                  onClick={() => setConfirmOpen(true)}
                >
                  <TrashIcon />
                  Xóa dự án
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-3.5 pt-3.5">
        <div className="mb-3.5 flex-1">
        <h2 id={`project-${project.id}-name`} className="m-0 truncate text-[15px] font-bold leading-[22px] text-[#111827]">
          {/* Link phủ toàn thẻ: bấm thẻ → màn hình Tổng quan của dự án */}
          <Link className="text-inherit no-underline outline-none after:absolute after:inset-0 after:content-['']" to={projectPaths.overview(project.id)}>
            {project.name}
          </Link>
        </h2>
        <p className="mb-0 mt-0.5 truncate text-xs leading-[18px] text-[#9ca3af]">{subtitle}</p>
        {project.genreNote && (
          <p className="mb-0 mt-2.5 line-clamp-2 text-[13px] leading-5 text-[#4b5563]">{project.genreNote}</p>
        )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[#f3f4f6] pt-3 text-[11.5px] leading-4 text-[#9ca3af]">
          <span className="truncate">
            {project.chapterCount} chương · {project.scriptCount} kịch bản
          </span>
          <span className="shrink-0">Tạo {formatProjectDate(project.createdAt)}</span>
        </div>
      </div>

      <AlertDialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-slate-900/30" />
          <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,400px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 font-sans shadow-2xl outline-none">
            <AlertDialog.Title className="m-0 text-base font-bold leading-6 text-[#111827]">Xóa dự án?</AlertDialog.Title>
            <AlertDialog.Description className="mb-0 mt-1.5 text-[13px] leading-5 text-[#6b7280]">
              Dự án “{project.name}” sẽ bị xóa khỏi danh sách. Không thể hoàn tác.
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-2.5">
              <AlertDialog.Close className="min-h-9 rounded-lg border border-[#e2e8f0] bg-white px-4 text-xs text-[#334155] hover:bg-slate-50">
                Hủy
              </AlertDialog.Close>
              <button
                className="min-h-9 rounded-lg bg-[#dc2626] px-4 text-xs font-bold text-white hover:bg-[#b91c1c]"
                onClick={() => {
                  setConfirmOpen(false)
                  onDelete(project)
                }}
                type="button"
              >
                Xóa dự án
              </button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </article>
  )
}

function DotsIcon() {
  return (
    <svg aria-hidden="true" className="size-3.5" fill="currentColor" viewBox="0 0 16 16">
      <circle cx="3.5" cy="8" r="1.4" />
      <circle cx="8" cy="8" r="1.4" />
      <circle cx="12.5" cy="8" r="1.4" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
      <path d="M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
      <path d="M4 7h16M9 7V4.5h6V7m-8.5 0 1 12.5h9l1-12.5M10 11v5m4-5v5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  )
}
