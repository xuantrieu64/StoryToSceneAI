import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type IconTileProps = {
  icon: LucideIcon
  tone?: 'peach' | 'green'
  size?: 'md' | 'lg'
  iconClassName?: string
  className?: string
}

/** Ô vuông bo góc chứa icon (48px trong thẻ bước, 64px ở CTA). */
export function IconTile({ icon: Icon, tone = 'peach', size = 'md', iconClassName, className }: IconTileProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center',
        tone === 'peach' ? 'bg-peach' : 'bg-brand-tint',
        size === 'md' ? 'size-12 rounded-xl' : 'size-16 rounded-2xl shadow-xs',
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(size === 'md' ? 'size-6' : 'size-[30px]', 'text-brand-deep', iconClassName)}
        strokeWidth={2}
      />
    </div>
  )
}
