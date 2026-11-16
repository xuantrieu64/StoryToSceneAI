import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type CheckItemProps = {
  icon: LucideIcon
  children: ReactNode
  /** Màu icon + chữ: `muted` (xám nâu), `green`, `berry` */
  tone?: 'muted' | 'green' | 'berry'
  className?: string
}

const toneClass = {
  muted: { icon: 'text-brand-deep', text: 'text-ink-muted' },
  green: { icon: 'text-brand-deep', text: 'text-brand-deep' },
  berry: { icon: 'text-berry', text: 'text-berry' },
}

/** Icon nhỏ + nhãn 12px (trust item, ghi chú dưới thẻ bước). */
export function CheckItem({ icon: Icon, children, tone = 'muted', className }: CheckItemProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <Icon aria-hidden="true" className={cn('size-3.5 shrink-0', toneClass[tone].icon)} strokeWidth={2.25} />
      <span className={cn('text-xs leading-4 font-semibold tracking-[0.04em]', toneClass[tone].text)}>
        {children}
      </span>
    </span>
  )
}
