import type { ReactNode } from 'react'
import { Clapperboard, PencilLine, Sparkle, UserRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { authRoutes } from '../auth-config'

/** Hai tab Đăng nhập / Đăng ký – điều hướng giữa /login và /register. */
function AuthModeTabs() {
  const tab = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex h-12 items-center justify-center gap-2 rounded-xl text-[15px] leading-5 font-semibold transition-colors outline-none focus-visible:ring-3 focus-visible:ring-jade-500/40',
      isActive ? 'bg-jade-800 text-white shadow-[0_8px_18px_-10px_rgb(3_108_69/0.8)]' : 'text-slate-700 hover:bg-white hover:text-jade-700',
    )
  return (
    <nav aria-label="Đăng nhập hoặc đăng ký" className="grid grid-cols-2 gap-1 rounded-2xl border border-slate-100 bg-slate-50/80 p-1">
      <NavLink to={authRoutes.login} className={tab} end>
        <UserRound aria-hidden="true" className="size-[18px]" />
        Đăng nhập
      </NavLink>
      <NavLink to={authRoutes.register} className={tab} end>
        <PencilLine aria-hidden="true" className="size-[18px]" />
        Đăng ký
      </NavLink>
    </nav>
  )
}

/** Hình clapperboard trang trí góc trên phải của card. */
function CardArt() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute top-8 right-9 hidden sm:block">
      <span className="absolute -inset-4 rounded-full bg-[radial-gradient(circle,#dff6ea_0%,transparent_70%)]" />
      <Sparkle className="absolute -top-1 -left-5 size-4 text-jade-200" />
      <Sparkle className="absolute top-8 -left-8 size-3 text-jade-200" />
      <span className="relative flex size-16 rotate-[-10deg] items-center justify-center rounded-2xl bg-linear-to-br from-jade-500 to-jade-700 text-white shadow-[0_14px_30px_-12px_rgb(3_108_69/0.7)]">
        <Clapperboard className="size-8" strokeWidth={1.75} />
      </span>
    </span>
  )
}

type AuthPanelProps = {
  eyebrow: string
  title: string
  titleId: string
  /** Form dài (Register): card rộng hơn và khoảng cách gọn hơn. */
  compact?: boolean
  children: ReactNode
}

/** Card form của trang Đăng nhập / Đăng ký: nhãn, tiêu đề, tab chuyển trang, nội dung. */
export function AuthPanel({ eyebrow, title, titleId, compact = false, children }: AuthPanelProps) {
  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'relative w-full rounded-[28px] border border-white bg-white/95 p-6 shadow-[0_40px_80px_-40px_rgb(3_108_69/0.45)] ring-1 ring-slate-100',
        compact ? 'max-w-[560px] sm:p-8' : 'max-w-[480px] sm:p-9',
      )}
    >
      <CardArt />
      <p className="text-xs leading-4 font-semibold tracking-[0.1em] text-jade-600 uppercase">{eyebrow}</p>
      <h2 id={titleId} className="mt-2 text-[30px] leading-9 font-bold tracking-[-0.02em] text-slate-800">
        {title}
      </h2>
      <div className={compact ? 'mt-5' : 'mt-7'}>
        <AuthModeTabs />
      </div>
      <div className={compact ? 'mt-5' : 'mt-6'}>{children}</div>
    </section>
  )
}
