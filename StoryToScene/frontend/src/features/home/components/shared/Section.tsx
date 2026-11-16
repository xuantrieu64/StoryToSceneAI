import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SectionProps = {
  id?: string
  /** `page` = nền #FAF9F6, `surface` = nền be #F3EFEA */
  tone?: 'page' | 'surface'
  className?: string
  innerClassName?: string
  children: ReactNode
  'aria-labelledby'?: string
}

/** Khung section chuẩn: padding dọc 96px (desktop), container tối đa 1200px (nội dung 1152px). */
export function Section({
  id,
  tone = 'page',
  className,
  innerClassName,
  children,
  ...aria
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'px-4 py-16 sm:px-6 md:py-20 lg:px-10 lg:py-24',
        tone === 'surface' ? 'bg-surface' : 'bg-page',
        className,
      )}
      {...aria}
    >
      <div className={cn('mx-auto w-full max-w-[1200px] lg:px-6', innerClassName)}>
        {children}
      </div>
    </section>
  )
}
