import type { LucideIcon } from 'lucide-react'
import { Database, Film, SquarePlay } from 'lucide-react'
import type { CurrentSubscription } from '../data/current-subscription.sample'
import type { SubscriptionPlan } from '../data/plans'
import { formatExpiry, formatLimit } from '../lib/format'

type CurrentPlanSummaryProps = {
  plan: SubscriptionPlan
  subscription: CurrentSubscription
}

/** Khối "Gói hiện tại" + 3 chỉ số sử dụng. */
export function CurrentPlanSummary({ plan, subscription }: CurrentPlanSummaryProps) {
  const { usage } = subscription
  const storageLimit = plan.limits.storageMb

  return (
    <section
      aria-labelledby="current-plan-title"
      className="grid gap-6 rounded-2xl border border-jade-100 bg-[linear-gradient(100deg,#effaf5_0%,#f7fdfa_55%,#e3f7ec_100%)] p-6 shadow-xs lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)] lg:items-center"
    >
      <div className="flex items-center gap-5">
        <HexagonBadge />
        <div className="min-w-0">
          <h2 id="current-plan-title" className="m-0 flex flex-wrap items-center gap-2 text-xl leading-7 font-bold text-slate-900">
            Gói hiện tại:
            <span className="rounded-full bg-jade-100 px-3 py-0.5 text-base leading-6 font-bold text-jade-600">
              {plan.name}
            </span>
          </h2>
          <p className="mt-1.5 mb-0 text-sm leading-5 text-slate-600">
            Hạn sử dụng: <span className="font-medium text-slate-800">{formatExpiry(subscription.expiresAt)}</span>
          </p>
        </div>
      </div>

      <dl className="m-0 grid grid-cols-3 gap-4 max-md:grid-cols-1 max-md:gap-3 md:divide-x md:divide-slate-200">
        <Metric icon={SquarePlay} label="Đã dùng" value={`${usage.aiCredits} / ${plan.limits.aiCreditsPerMonth} lượt AI`} />
        <Metric icon={Film} label="Đã tạo" value={`${usage.projects} / ${formatLimit(plan.limits.projects)} dự án`} />
        <Metric
          icon={Database}
          label="Dung lượng"
          value={storageLimit === null ? `${usage.storageMb} MB` : `${usage.storageMb} MB / ${storageLimit} MB`}
        />
      </dl>
    </section>
  )
}

function Metric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 md:px-5 md:first:pl-0">
      <Icon aria-hidden="true" className="size-8 shrink-0 text-jade-500" strokeWidth={1.6} />
      <div className="min-w-0">
        <dt className="text-xs leading-4 text-slate-500">{label}</dt>
        <dd className="m-0 mt-1 text-sm leading-5 font-semibold whitespace-nowrap text-slate-800">{value}</dd>
      </div>
    </div>
  )
}

function HexagonBadge() {
  return (
    <svg aria-hidden="true" className="size-16 shrink-0 drop-shadow-[0_8px_14px_rgb(0_176_116/0.35)]" viewBox="0 0 64 64">
      <path d="M32 3 57 17.5v29L32 61 7 46.5v-29L32 3Z" fill="#00b074" />
      <path d="M32 9.5 51.5 20.8v22.4L32 54.5 12.5 43.2V20.8L32 9.5Z" fill="#009865" />
      <path d="M35 18 23 35h8l-2 11 12-17h-8l2-11Z" fill="#fff" />
    </svg>
  )
}
