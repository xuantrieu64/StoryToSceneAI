import { Link } from 'react-router-dom'
import type { Project } from '@/features/Dashboard/types/project'
import { nextStage } from '../data/stages'

/** Khung "BƯỚC KẾ TIẾP": gợi ý công đoạn đầu tiên chưa hoàn thành. */
export function NextStepCard({ project }: { project: Project }) {
  const stage = nextStage(project)
  const href = stage?.path?.(project.id)

  return (
    <section
      aria-labelledby="next-step-title"
      className="flex items-center justify-between gap-6 rounded-xl border-2 border-[#39b536] bg-[#f3faf2] px-6 py-5 max-[760px]:flex-col max-[760px]:items-start max-[760px]:gap-4 max-[760px]:px-4"
    >
      <div className="min-w-0">
        <p className="m-0 text-[11px] font-bold uppercase leading-4 tracking-[0.6px] text-[#39b536]">Bước kế tiếp</p>
        <h2 id="next-step-title" className="mb-0 mt-1.5 text-base font-bold leading-6 text-[#111827]">
          {stage ? stage.next.title : 'Đã hoàn thành mọi công đoạn'}
        </h2>
        <p className="mb-0 mt-1 text-[13px] leading-5 text-[#4b5563]">
          {stage ? stage.next.description : 'Bạn có thể quay lại bất kỳ công đoạn nào để chỉnh sửa.'}
        </p>
      </div>

      {stage &&
        (href ? (
          <Link
            className="inline-flex min-h-10 shrink-0 items-center rounded-lg bg-[#39b536] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#32a92f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#198c22]"
            to={href}
          >
            {stage.next.cta}
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="inline-flex min-h-10 shrink-0 cursor-not-allowed items-center rounded-lg bg-[#e5e7eb] px-5 text-sm font-semibold text-[#6b7280]"
            title="Sắp ra mắt"
          >
            {stage.next.cta} · Sắp ra mắt
          </span>
        ))}
    </section>
  )
}
