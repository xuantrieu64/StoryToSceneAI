import { Link } from 'react-router-dom'
import type { Project } from '@/features/Dashboard/types/project'
import { completedStageCount, nextStage, stages, type Stage } from '../data/stages'

/** "Các công đoạn": thanh tiến độ + 8 thẻ công đoạn. */
export function StageGrid({ project }: { project: Project }) {
  const done = completedStageCount(project)
  const percent = Math.round((done / stages.length) * 100)
  const nextId = nextStage(project)?.id

  return (
    <section aria-labelledby="stages-title">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="stages-title" className="m-0 text-base font-bold leading-6 text-[#111827]">
          Các công đoạn
        </h2>
        <p className="m-0 text-xs leading-5 text-[#6b7280]">Làm lần lượt theo số, quay lại bước nào cũng được.</p>
      </div>

      <div className="mt-2.5 flex items-center gap-3">
        <span className="shrink-0 text-xs font-semibold leading-4 text-[#374151]">
          {done} / {stages.length} công đoạn xong
        </span>
        <div
          aria-label="Tiến độ hoàn thành"
          aria-valuemax={stages.length}
          aria-valuemin={0}
          aria-valuenow={done}
          aria-valuetext={`${done} trên ${stages.length} công đoạn`}
          className="h-1.5 w-full max-w-[280px] overflow-hidden rounded-full bg-[#e5e7eb]"
          role="progressbar"
        >
          <div className="h-full rounded-full bg-[#39b536] transition-[width]" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <ol className="m-0 mt-4 grid list-none grid-cols-4 gap-3.5 p-0 max-[1180px]:grid-cols-2 max-[560px]:grid-cols-1">
        {stages.map((stage) => (
          <li className="flex" key={stage.id}>
            <StageCard isNext={stage.id === nextId} project={project} stage={stage} />
          </li>
        ))}
      </ol>
    </section>
  )
}

function StageCard({ isNext, project, stage }: { isNext: boolean; project: Project; stage: Stage }) {
  const href = stage.path?.(project.id)
  const done = stage.isDone(project)
  const className = `flex w-full gap-3.5 rounded-xl border bg-white p-4 text-left transition-colors ${
    isNext ? 'border-2 border-[#39b536] p-[15px]' : 'border-[#e5e7eb]'
  } ${href ? 'hover:border-[#39b536] hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]' : ''}`

  const content = (
    <>
      <span
        aria-hidden="true"
        className={`grid size-9 shrink-0 place-items-center rounded-lg text-base font-bold ${
          done ? 'bg-[#39b536] text-white' : isNext ? 'bg-[#eaf7e9] text-[#39b536]' : 'bg-[#f3f4f6] text-[#4b5563]'
        }`}
      >
        {stage.number}
      </span>
      <span className="flex min-w-0 flex-col">
        <strong className="text-[15px] font-bold leading-[22px] text-[#111827]">{stage.title}</strong>
        <span className="mt-0.5 text-[13px] leading-5 text-[#6b7280]">{stage.description}</span>
        <span className={`mt-2 text-xs font-semibold leading-4 ${done ? 'text-[#39b536]' : 'text-[#374151]'}`}>
          {stage.status(project)}
          {!href && <span className="font-normal text-[#9ca3af]"> · Sắp ra mắt</span>}
        </span>
      </span>
    </>
  )

  const label = `Công đoạn ${stage.number}: ${stage.title}, ${stage.status(project)}`

  return href ? (
    <Link aria-label={label} className={className} to={href}>
      {content}
    </Link>
  ) : (
    <div aria-disabled="true" aria-label={`${label} (sắp ra mắt)`} className={className}>
      {content}
    </div>
  )
}
