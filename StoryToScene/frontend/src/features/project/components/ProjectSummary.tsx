import { projectTypeLabel } from '@/features/Dashboard/lib/project-display'
import type { Project } from '@/features/Dashboard/types/project'

/** Thẻ thông tin dự án: tên + các nhãn loại truyện, khung hình, trạng thái chương & kịch bản. */
export function ProjectSummary({ project }: { project: Project }) {
  const chips = [
    projectTypeLabel[project.type],
    `Khung ${project.aspectRatio}`,
    project.chapterCount > 0 ? `${project.chapterCount} chương` : 'Chưa có chương',
    project.scriptCount > 0 ? `${project.scriptCount} kịch bản` : 'Chưa có kịch bản',
  ]

  return (
    <section aria-label="Thông tin dự án" className="rounded-xl border border-[#e5e7eb] bg-white px-6 py-5 max-[760px]:px-4">
      <h2 className="m-0 break-words text-xl font-bold leading-7 text-[#111827]">{project.name}</h2>
      <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
        {chips.map((chip) => (
          <li className="rounded-full bg-[#f3f4f6] px-3 py-1 text-xs leading-4 text-[#4b5563]" key={chip}>
            {chip}
          </li>
        ))}
      </ul>
    </section>
  )
}
