import type { ReactNode } from 'react'
import { Check, Clapperboard, LoaderCircle, MessageSquarePlus } from 'lucide-react'
import { scriptHeading, type Script } from '@/features/script/lib/script-storage'
import { cn } from '@/lib/utils'
import type { EpisodeStatus } from './StoryboardPanel'

type StoryboardToolRailProps = {
  scripts: Script[]
  activeId: string | null
  statusOf: (scriptId: string) => EpisodeStatus
  onSelect: (scriptId: string) => void
  onGenerate: () => void
  canGenerate: boolean
  onNewChat: () => void
}

/** Thanh công cụ dọc: chuyển nhanh giữa các tập (kèm trạng thái) + thao tác nhanh. Màn hẹp → nằm ngang. */
export function StoryboardToolRail({ scripts, activeId, statusOf, onSelect, onGenerate, canGenerate, onNewChat }: StoryboardToolRailProps) {
  return (
    <nav
      aria-label="Công cụ phân cảnh"
      className="flex w-[60px] shrink-0 flex-col items-center gap-2 border-r border-[#eceef1] py-4 max-[900px]:w-full max-[900px]:flex-row max-[900px]:overflow-x-auto max-[900px]:border-b max-[900px]:border-r-0 max-[900px]:px-4 max-[900px]:py-2.5"
    >
      <div className="flex flex-col items-center gap-2 max-[900px]:flex-row" role="group" aria-label="Tập">
        {scripts.map((script) => {
          const status = statusOf(script.id)
          const active = script.id === activeId
          return (
            <button
              aria-current={active ? 'true' : undefined}
              aria-label={`${scriptHeading(script)} – ${statusLabel[status]}`}
              className={cn(
                'relative grid size-9 shrink-0 place-items-center rounded-lg border text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]',
                active ? 'border-[#39b536] bg-[#ecf8eb] text-[#198c22]' : 'border-[#e5e7eb] bg-white text-[#374151] hover:border-[#d1d5db] hover:bg-[#f9fafb]',
              )}
              key={script.id}
              onClick={() => onSelect(script.id)}
              title={`${scriptHeading(script)} · ${statusLabel[status]}`}
              type="button"
            >
              T{script.episode}
              {status !== 'none' && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute -right-1 -top-1 grid size-4 place-items-center rounded-full text-white ring-2 ring-white',
                    status === 'ready' ? 'bg-[#39b536]' : 'bg-[#f59e0b]',
                  )}
                >
                  {status === 'ready' ? <Check className="size-2.5" strokeWidth={3} /> : <LoaderCircle className="size-2.5 animate-spin" strokeWidth={3} />}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {scripts.length > 0 && <span aria-hidden="true" className="my-1 h-px w-6 shrink-0 bg-[#e5e7eb] max-[900px]:mx-1 max-[900px]:h-6 max-[900px]:w-px" />}

      <RailButton disabled={!canGenerate} label="Lập bảng phân cảnh cho tập đang chọn" onClick={onGenerate}>
        <Clapperboard aria-hidden="true" className="size-4" />
      </RailButton>
      <RailButton label="Hội thoại mới" onClick={onNewChat}>
        <MessageSquarePlus aria-hidden="true" className="size-4" />
      </RailButton>
    </nav>
  )
}

const statusLabel: Record<EpisodeStatus, string> = {
  none: 'Chưa tạo phân cảnh',
  generating: 'Đang lập phân cảnh',
  ready: 'Đã có phân cảnh',
}

function RailButton({ label, onClick, disabled = false, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      aria-label={label}
      className="grid size-9 shrink-0 place-items-center rounded-lg text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536] disabled:cursor-not-allowed disabled:text-[#d1d5db] disabled:hover:bg-transparent"
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  )
}
