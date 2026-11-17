import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Nhãn nhỏ màu xanh phía trên tiêu đề section (chỉ dùng trong SectionHeading). */
function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-xs leading-4 font-semibold tracking-[0.12em] text-jade-600 uppercase">{children}</p>
}

type SectionHeadingProps = {
  id: string
  eyebrow: string
  title: ReactNode
  description?: string
  /** `center`: căn giữa · `split`: tiêu đề trái, mô tả phải · `left`: căn trái */
  layout?: 'center' | 'split' | 'left'
  className?: string
}

/** Eyebrow + tiêu đề H2 + mô tả của mỗi section trên Homepage. */
export function SectionHeading({ id, eyebrow, title, description, layout = 'center', className }: SectionHeadingProps) {
  const heading = (
    <h2 id={id} className="mt-2 text-[28px] leading-9 font-bold tracking-[-0.02em] text-slate-900 text-balance sm:text-[32px] sm:leading-10">
      {title}
    </h2>
  )

  if (layout === 'split') {
    return (
      <div className={cn('flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-10', className)}>
        <div>
          <Eyebrow>{eyebrow}</Eyebrow>
          {heading}
        </div>
        {description && (
          <p className="max-w-[460px] text-sm leading-6 text-slate-500 lg:text-right">{description}</p>
        )}
      </div>
    )
  }

  return (
    <div className={cn(layout === 'center' ? 'mx-auto max-w-2xl text-center' : '', className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      {heading}
      {description && <p className="mt-3 text-sm leading-6 text-slate-500 text-pretty">{description}</p>}
    </div>
  )
}
