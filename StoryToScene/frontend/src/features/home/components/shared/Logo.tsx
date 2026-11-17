import { Film } from 'lucide-react'
import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg bg-jade-500 text-white shadow-xs', className)}>
      <Film className="size-5" strokeWidth={2} />
    </span>
  )
}

/** Logo đầy đủ ở header: icon + "StoryToScene" + nhãn AI + tagline. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="flex flex-col">
        <span className="flex items-center gap-1.5">
          <span className="text-[17px] leading-5 font-bold tracking-[-0.02em] text-slate-900">StoryToScene</span>
          <span className="rounded-md bg-jade-50 px-1.5 py-px text-[10px] leading-4 font-bold text-jade-600">AI</span>
        </span>
        <span className="text-[9px] leading-3 font-semibold tracking-[0.14em] text-slate-400 uppercase">
          Hollywood Script Engine
        </span>
      </span>
    </span>
  )
}
