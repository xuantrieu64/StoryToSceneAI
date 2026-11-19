import { Trash2, Triangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { contentExcerpt, sceneHeading, scriptHeading, type Script } from '../lib/script-storage'

type ScriptCardProps = {
  script: Script
  /** Trang Biên tập của tập này. */
  href: string
  selected: boolean
  onToggle: (checked: boolean) => void
  onDelete: () => void
}

/** Thẻ một tập kịch bản: tiêu đề, checkbox chọn, dòng cảnh mở đầu và nút xóa. */
export function ScriptCard({ script, href, selected, onToggle, onDelete }: ScriptCardProps) {
  const heading = scriptHeading(script)
  const firstScene = script.scenes[0]
  const excerpt = contentExcerpt(script.content)

  return (
    <article
      className={cn(
        // relative + liên kết phủ cả thẻ (after:inset-0): bấm vào thẻ mở Biên tập; checkbox & nút xóa nằm trên (z-10)
        'relative flex min-h-[116px] min-w-0 flex-col justify-between gap-5 rounded-xl border bg-white px-[18px] pb-4 pt-[18px] transition-colors focus-within:ring-2 focus-within:ring-[#39b536]/30',
        selected ? 'border-[#b9e3b6] bg-[#f3faf2]' : 'border-[#e5e7eb] hover:border-[#b9e3b6] hover:shadow-sm',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="m-0 min-w-0 break-words text-[15px] font-semibold leading-6 text-[#111827]">
          <Link className="outline-none after:absolute after:inset-0 after:rounded-xl after:content-[''] hover:text-[#2f9a2d]" title="Mở biên tập" to={href}>
            {heading}
          </Link>
        </h3>
        <input
          aria-label={`Chọn ${heading}`}
          checked={selected}
          className="relative z-10 mt-1 size-4 shrink-0 cursor-pointer accent-[#39b536]"
          onChange={(event) => onToggle(event.target.checked)}
          type="checkbox"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        {firstScene ? (
          <p className="m-0 flex min-w-0 items-center gap-1.5 text-[13px] leading-5 text-[#4b5563]" title={[sceneHeading(firstScene, 0), firstScene.summary].filter(Boolean).join(' – ')}>
            <span className="shrink-0 max-[420px]:shrink">{sceneHeading(firstScene, 0)}</span>
            {firstScene.summary && (
              <>
                <Triangle aria-hidden="true" className="size-3 shrink-0 text-[#6b7280]" strokeWidth={1.8} />
                <span className="min-w-0 truncate">{firstScene.summary}</span>
              </>
            )}
            {script.scenes.length > 1 && (
              <span className="shrink-0 rounded-full bg-[#f3f4f6] px-1.5 text-[11px] text-[#6b7280]">+{script.scenes.length - 1} cảnh</span>
            )}
          </p>
        ) : excerpt ? (
          // Kịch bản tạo từ nội dung (chưa tách cảnh) → hiện dòng đầu của nội dung
          <p className="m-0 min-w-0 truncate text-[13px] leading-5 text-[#4b5563]" title={excerpt}>
            {excerpt}
          </p>
        ) : (
          <p className="m-0 text-[13px] leading-5 text-[#9ca3af]">Chưa có cảnh nào</p>
        )}
        <button
          aria-label={`Xóa ${heading}`}
          className="relative z-10 grid size-8 shrink-0 place-items-center rounded-lg text-[#9ca3af] transition-colors hover:bg-[#fef2f2] hover:text-[#dc2626] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]"
          onClick={onDelete}
          title="Xóa kịch bản"
          type="button"
        >
          <Trash2 aria-hidden="true" className="size-4" strokeWidth={1.8} />
        </button>
      </div>
    </article>
  )
}
