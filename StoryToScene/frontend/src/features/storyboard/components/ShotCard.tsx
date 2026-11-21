import { Mic, Users, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Shot } from '../lib/storyboard-storage'
import { ShotFrame } from './ShotFrame'

type ShotCardProps = {
  shot: Shot
  heading: string
  selected: boolean
  /** Vừa được sửa qua chat → viền sáng tạm thời. */
  highlighted: boolean
  onOpen: () => void
}

/** Thẻ cú máy dạng Storyboard: hình (phía trên) · tên + cỡ cảnh · chuyển động · thời lượng · mô tả · nhân vật · âm thanh. */
export function ShotCard({ shot, heading, selected, highlighted, onOpen }: ShotCardProps) {
  const voice = shot.dialogue ? (shot.character ?? 'Thoại') : shot.narration ? 'Lời dẫn' : null

  return (
    <li className="min-w-0" id={`shot-${shot.number}`}>
      <button
        aria-label={`Cú máy ${shot.number}: ${shot.size}, ${shot.movement}, ${shot.duration} giây. Mở để xem và sửa`}
        aria-pressed={selected}
        className={cn(
          'flex h-full w-full flex-col rounded-xl border bg-white p-2.5 text-left transition-[border-color,box-shadow] duration-300 hover:border-[#b9e3b6] hover:shadow-[0_4px_14px_rgba(16,24,40,0.06)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]',
          selected || highlighted ? 'border-[#39b536] shadow-[0_0_0_3px_rgba(57,181,54,0.12)]' : 'border-[#eceef1]',
        )}
        onClick={onOpen}
        type="button"
      >
        <ShotFrame heading={heading} shot={shot} />

        <div className="flex min-w-0 flex-1 flex-col px-1 pb-0.5 pt-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-semibold text-[#111827]">Cú máy {shot.number}</span>
            <span className="shrink-0 text-xs tabular-nums text-[#6b7280]">{shot.duration} giây</span>
          </div>
          <p className="m-0 mt-0.5 text-xs text-[#6b7280]">
            <span className="font-medium text-[#198c22]">{shot.size}</span> · {shot.movement}
          </p>

          <p className="mb-0 mt-2 line-clamp-3 text-[13px] leading-5 text-[#1f2937]">{shot.description}</p>
          {shot.dialogue && <p className="mb-0 mt-1 line-clamp-2 text-[13px] italic leading-5 text-[#4b5563]">“{shot.dialogue}”</p>}

          <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2.5 text-xs text-[#6b7280]">
            {shot.characters.length > 0 && (
              <span className="inline-flex min-w-0 items-center gap-1" title="Nhân vật trong khung">
                <Users aria-hidden="true" className="size-3.5 shrink-0" />
                <span className="truncate">{shot.characters.join(', ')}</span>
              </span>
            )}
            {voice && (
              <span className="inline-flex items-center gap-1 text-[#198c22]" title={shot.narration ?? shot.dialogue}>
                <Mic aria-hidden="true" className="size-3.5" />
                {voice}
              </span>
            )}
            {shot.sound && (
              <span className="inline-flex items-center" title={`Âm thanh: ${shot.sound}`}>
                <Volume2 aria-label={`Âm thanh: ${shot.sound}`} className="size-3.5" />
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  )
}
