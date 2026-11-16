import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'

type LogoProps = {
  /** `header`: 18px Bold, `footer`: 20px SemiBold (Be Vietnam Pro). */
  variant?: 'header' | 'footer'
  className?: string
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-7 shrink-0 items-center justify-center rounded-sm bg-brand pl-0.5 shadow-[0_1px_1px_rgb(57_181_54/0.3)]',
        className,
      )}
    >
      <Play className="size-3.5 fill-white text-white" strokeWidth={2} />
    </span>
  )
}

export function Logo({ variant = 'header', className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark />
      <span
        className={cn(
          'whitespace-nowrap text-ink',
          variant === 'header'
            ? 'text-lg leading-7 font-bold tracking-[-0.025em]'
            : 'text-xl leading-7 font-semibold tracking-[-0.025em]',
        )}
      >
        StoryToScene
      </span>
    </span>
  )
}
