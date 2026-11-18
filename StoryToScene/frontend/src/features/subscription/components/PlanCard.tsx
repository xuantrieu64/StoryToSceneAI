import type { LucideIcon } from 'lucide-react'
import { Box, Check, Crown, Star, X, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { homeButton } from '@/features/home/components/shared/button-styles'
import { cn } from '@/lib/utils'
import { FEATURED_BADGE, planRank, priceFor, type BillingCycle, type PlanId, type SubscriptionPlan } from '../data/plans'
import { formatNumber } from '../lib/format'

const planVisual: Record<PlanId, { icon: LucideIcon; badge: string }> = {
  free: { icon: Box, badge: 'bg-teal-50 text-teal-500' },
  basic: { icon: Zap, badge: 'bg-amber-50 text-amber-500 [&_svg]:fill-current' },
  pro: { icon: Crown, badge: 'bg-jade-100 text-jade-600 [&_svg]:fill-current' },
}

type PlanCardProps = {
  plan: SubscriptionPlan
  cycle: BillingCycle
  currentPlanId: PlanId
  /** Gọi khi chưa có link thanh toán cho gói này. */
  onCheckoutUnavailable: (plan: SubscriptionPlan) => void
}

/**
 * Thẻ gói theo thiết kế trang Nâng cấp gói.
 * Nội dung chữ (tên, đối tượng, giá, mô tả, tính năng, nút) lấy từ Bảng giá trang chủ.
 */
export function PlanCard({ plan, cycle, currentPlanId, onCheckoutUnavailable }: PlanCardProps) {
  const { content, featured } = plan
  const { icon: Icon, badge } = planVisual[plan.id]
  const price = priceFor(plan, cycle)
  const isFree = plan.monthlyPrice === 0
  const unit = isFree ? 'mãi mãi' : cycle === 'monthly' ? 'tháng' : 'năm'
  const isCurrent = plan.id === currentPlanId
  const isLower = planRank[plan.id] < planRank[currentPlanId]
  const checkoutHref = plan.checkoutHref?.[cycle]
  const ctaClass = featured
    ? homeButton({ variant: 'primary', size: 'block', className: 'h-12 bg-[linear-gradient(180deg,#00b074_0%,#009865_100%)] text-base font-bold' })
    : homeButton({ variant: 'outline', size: 'block', className: 'h-12 text-base font-bold text-jade-600 hover:text-jade-700' })

  return (
    <article
      aria-labelledby={`plan-${plan.id}-name`}
      className={cn(
        'relative flex flex-col rounded-2xl p-6',
        featured
          ? 'border-2 border-jade-500 bg-[linear-gradient(180deg,#effaf5_0%,#ffffff_70%)] shadow-[0_24px_50px_-28px_rgb(0_176_116/0.55)]'
          : 'border border-slate-200 bg-white shadow-xs',
      )}
    >
      {featured && (
        <span className="absolute -top-3 right-4 inline-flex items-center gap-1 rounded-md bg-jade-500 px-2.5 py-1 text-xs leading-4 font-semibold text-white shadow-sm">
          <Star aria-hidden="true" className="size-3.5 fill-amber-300 text-amber-300" />
          {FEATURED_BADGE}
        </span>
      )}

      <div className="flex items-center gap-4">
        <span className={cn('grid size-14 shrink-0 place-items-center rounded-full', badge)}>
          <Icon aria-hidden="true" className="size-7" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h3 id={`plan-${plan.id}-name`} className="m-0 text-xl leading-7 font-bold text-slate-900">
            {content.name}
          </h3>
          <p className="m-0 text-[13px] leading-5 text-slate-500">{content.audience}</p>
        </div>
      </div>

      <p className="mt-6 mb-0 flex flex-wrap items-baseline gap-x-2">
        <span className="text-[32px] leading-10 font-bold tracking-[-0.02em] text-slate-900 tabular-nums">{formatNumber(price)} đ</span>
        <span className="text-base text-slate-500">/ {unit}</span>
      </p>
      {cycle === 'yearly' && !isFree && (
        <p className="mt-1 mb-0 text-xs leading-4 text-jade-600">Tương đương {formatNumber(Math.round(price / 12))} đ / tháng</p>
      )}
      <p className="mt-2 mb-0 text-[13px] leading-5 text-slate-500">{content.description}</p>

      <ul className="mt-5 mb-0 flex flex-1 list-none flex-col gap-3 p-0">
        {content.features.map((f) => {
          const included = f.included !== false
          return (
            <li className={cn('flex items-start gap-3 text-[15px] leading-6', included ? 'text-slate-700' : 'text-slate-400')} key={f.text + (f.strong ?? '')}>
              <FeatureIcon featured={featured} included={included} />
              <span>
                {!included && <span className="sr-only">Không bao gồm: </span>}
                {f.strong && f.text.startsWith(' ') && <strong className="font-semibold text-slate-900">{f.strong}</strong>}
                {f.text}
                {f.strong && !f.text.startsWith(' ') && <strong className="font-semibold text-slate-900">{f.strong}</strong>}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="mt-6">
        {isCurrent || isLower ? (
          <span
            aria-disabled="true"
            className={homeButton({ variant: 'soft', size: 'block', className: 'h-12 cursor-default border-transparent bg-slate-100 text-slate-500 hover:bg-slate-100' })}
          >
            {isCurrent && <Check aria-hidden="true" className="text-jade-500" strokeWidth={2.5} />}
            {isCurrent ? 'Gói hiện tại' : 'Đã bao gồm trong gói của bạn'}
          </span>
        ) : checkoutHref ? (
          <Link className={ctaClass} to={checkoutHref}>
            {content.cta.label}
          </Link>
        ) : (
          <button className={ctaClass} onClick={() => onCheckoutUnavailable(plan)} type="button">
            {content.cta.label}
          </button>
        )}
      </div>
    </article>
  )
}

function FeatureIcon({ featured, included }: { featured: boolean; included: boolean }) {
  if (!included) return <X aria-hidden="true" className="mt-1 size-[18px] shrink-0 text-slate-300" strokeWidth={2.5} />
  if (featured) {
    return (
      <span aria-hidden="true" className="mt-1 grid size-[18px] shrink-0 place-items-center rounded-full bg-jade-500 text-white">
        <Check className="size-3" strokeWidth={3} />
      </span>
    )
  }
  return <Check aria-hidden="true" className="mt-1 size-[18px] shrink-0 text-jade-500" strokeWidth={3} />
}
