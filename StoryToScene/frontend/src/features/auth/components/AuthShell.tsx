import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { AuthBackdrop } from './AuthBackdrop'

type AuthShellProps = {
  header: ReactNode
  headline: ReactNode
  illustration: ReactNode
  card: ReactNode
  highlights: ReactNode
  /** Cột form rộng hơn (Register – form dài) */
  wideCard?: boolean
}

/**
 * Khung trang Đăng nhập / Đăng ký.
 * Mobile/tablet: xếp dọc (tiêu đề → form → lợi ích); ≥1024px: 2 cột
 * (nội dung + minh họa | form); ≥1280px: 3 vùng như thiết kế.
 */
export function AuthShell({ header, headline, illustration, card, highlights, wideCard = false }: AuthShellProps) {
  return (
    <div className="relative isolate flex min-h-svh flex-col overflow-hidden font-sans text-slate-800">
      <AuthBackdrop />
      {header}
      <main
        className={cn(
          "mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-x-8 gap-y-10 px-4 py-10 [grid-template-areas:'headline'_'card'_'highlights'] sm:px-6 lg:px-8 lg:py-14 lg:[grid-template-areas:'headline_card'_'illustration_card'_'highlights_card'] xl:gap-x-6 xl:[grid-template-areas:'headline_illustration_card'_'highlights_illustration_card']",
          wideCard
            ? 'lg:grid-cols-[minmax(0,1fr)_480px] xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)_520px]'
            : 'lg:grid-cols-[minmax(0,1fr)_420px] xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_440px]',
        )}
      >
        <div className="[grid-area:headline] xl:self-end">{headline}</div>
        <div className="hidden [grid-area:illustration] lg:block">{illustration}</div>
        <div className="flex justify-center [grid-area:card] lg:justify-end">{card}</div>
        <div className="[grid-area:highlights] xl:self-start">{highlights}</div>
      </main>
    </div>
  )
}
