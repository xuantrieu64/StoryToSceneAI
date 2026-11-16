import { cn } from '@/lib/utils'

type SectionHeaderProps = {
  id: string
  eyebrow: string
  title: string
  description: string
  className?: string
}

/** Eyebrow + H2 + mô tả, căn giữa (toàn bộ dùng Be Vietnam Pro). */
export function SectionHeader({ id, eyebrow, title, description, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-col items-center text-center', className)}>
      <p className="mb-2 text-[13px] leading-[18px] font-semibold tracking-[0.1em] text-clay uppercase">
        {eyebrow}
      </p>
      <h2
        id={id}
        className="mb-2 text-[32px] leading-10 font-semibold tracking-[-0.025em] text-ink text-balance sm:text-[40px] sm:leading-[48px]"
      >
        {title}
      </h2>
      <p className="max-w-[576px] text-[15px] leading-6 text-ink-muted text-pretty">{description}</p>
    </div>
  )
}
