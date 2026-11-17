import type { ReactNode } from 'react'
import { Check, CirclePlay, Star, Users, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Chữ nhấn màu xanh kèm nét gạch chân cong trang trí (dùng trong tiêu đề). */
export function Highlight({ children, className, underlineClassName }: { children: ReactNode; className?: string; underlineClassName?: string }) {
  return (
    <span className={cn('relative w-fit text-jade-600', className)}>
      {children}
      <svg aria-hidden="true" viewBox="0 0 300 18" className={cn('absolute -bottom-3 h-3 text-jade-500', underlineClassName)} preserveAspectRatio="none">
        <path d="M2 14 C 80 2, 200 2, 298 10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  )
}

type AuthHeadlineProps = {
  badgeIcon: LucideIcon
  badge: string
  title: ReactNode
  description: string
}

/** Badge + tiêu đề + mô tả (cột trái, phần đầu). */
export function AuthHeadline({ badgeIcon: BadgeIcon, badge, title, description }: AuthHeadlineProps) {
  return (
    <div>
      <p className="inline-flex items-center gap-2 rounded-full border border-jade-100 bg-white/90 px-4 py-2 text-sm leading-5 font-semibold text-jade-700 shadow-[0_6px_20px_-12px_rgb(3_108_69/0.4)]">
        <BadgeIcon aria-hidden="true" className="size-4 text-jade-600" />
        {badge}
      </p>
      <h1 className="mt-6 text-[38px] leading-[1.12] font-bold tracking-[-0.03em] text-slate-800 sm:text-[46px] xl:text-[46px]">{title}</h1>
      <p className="mt-7 max-w-[470px] text-base leading-7 text-slate-600">{description}</p>
    </div>
  )
}

const stats = [
  { value: '10K+', label: 'Người dùng', icon: Users, tone: 'text-jade-600' },
  { value: '50K+', label: 'Video đã tạo', icon: CirclePlay, tone: 'text-jade-600' },
  { value: '4.9/5', label: 'Đánh giá', icon: Star, tone: 'text-amber-400' },
]

/** Lợi ích có dấu tích + 3 thẻ thống kê (cột trái, phần dưới). */
export function AuthHighlights({ benefits }: { benefits: string[] }) {
  return (
    <div>
      <ul className="flex flex-col gap-3.5">
        {benefits.map((b) => (
          <li key={b} className="flex items-center gap-3 text-[15px] leading-6 text-slate-700">
            <span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center rounded-full bg-jade-500 text-white">
              <Check className="size-3" strokeWidth={3} />
            </span>
            {b}
          </li>
        ))}
      </ul>
      <dl className="mt-8 grid max-w-[440px] grid-cols-3 gap-3 sm:gap-4">
        {stats.map(({ value, label, icon: Icon, tone }) => (
          <div key={label} className="flex flex-col items-center rounded-2xl border border-slate-100 bg-white/90 px-2 py-4 text-center shadow-[0_10px_30px_-18px_rgb(15_23_42/0.25)]">
            <Icon aria-hidden="true" className={`size-7 ${tone}`} strokeWidth={1.75} />
            {/* dt phải đứng trước dd trong HTML; dùng order để số vẫn hiển thị phía trên nhãn */}
            <dt className="order-3 text-xs leading-4 text-slate-500 sm:text-[13px]">{label}</dt>
            <dd className="order-2 mt-2 text-xl leading-7 font-bold text-slate-800 tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
