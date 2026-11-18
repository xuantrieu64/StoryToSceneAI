import type { LucideIcon } from 'lucide-react'
import { Clock, Database, Folder, Zap } from 'lucide-react'
import type { CurrentSubscription } from '../data/current-subscription.sample'
import type { SubscriptionPlan } from '../data/plans'
import { formatLimit, usagePercent } from '../lib/format'

type UsageStatsProps = {
  plan: SubscriptionPlan
  subscription: CurrentSubscription
}

/** "Thống kê sử dụng tháng này": 3 thanh tiến độ theo hạn mức của gói hiện tại. */
export function UsageStats({ plan, subscription }: UsageStatsProps) {
  const { usage } = subscription
  const items: { icon: LucideIcon; label: string; detail: string; percent: number | null }[] = [
    {
      icon: Zap,
      label: 'Lượt AI',
      detail: `${usage.aiCredits} / ${plan.limits.aiCreditsPerMonth}`,
      percent: usagePercent(usage.aiCredits, plan.limits.aiCreditsPerMonth),
    },
    {
      icon: Folder,
      label: 'Dự án',
      detail: `${usage.projects} / ${formatLimit(plan.limits.projects)}`,
      percent: plan.limits.projects === null ? null : usagePercent(usage.projects, plan.limits.projects),
    },
    {
      icon: Database,
      label: 'Dung lượng',
      detail: plan.limits.storageMb === null ? `${usage.storageMb} MB` : `${usage.storageMb} MB / ${plan.limits.storageMb} MB`,
      percent: plan.limits.storageMb === null ? null : usagePercent(usage.storageMb, plan.limits.storageMb),
    },
  ]

  return (
    <section aria-labelledby="usage-title" className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xs max-sm:p-4">
      <h2 id="usage-title" className="m-0 flex items-center gap-3 text-xl leading-7 font-bold text-slate-900">
        <Clock aria-hidden="true" className="size-6 text-jade-500" strokeWidth={2} />
        Thống kê sử dụng tháng này
      </h2>

      <ul className="m-0 mt-4 list-none divide-y divide-slate-100 p-0">
        {items.map(({ icon: Icon, label, detail, percent }) => (
          <li className="flex items-center gap-4 py-5 last:pb-1" key={label}>
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-jade-50 text-jade-500">
              <Icon aria-hidden="true" className="size-6" strokeWidth={1.75} />
            </span>
            <div className="w-28 shrink-0 max-sm:w-24">
              <p className="m-0 text-sm leading-5 font-medium text-slate-800">{label}</p>
              <p className="m-0 mt-0.5 text-sm leading-5 text-slate-500">{detail}</p>
            </div>
            {percent === null ? (
              <p className="m-0 flex-1 text-right text-sm text-slate-500">Không giới hạn</p>
            ) : (
              <>
                <div
                  aria-label={`${label}: đã dùng ${percent}%`}
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={percent}
                  className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100"
                  role="progressbar"
                >
                  <div className="h-full rounded-full bg-jade-500" style={{ width: `${percent}%` }} />
                </div>
                <span className="w-11 shrink-0 text-right text-sm text-slate-600 tabular-nums">{percent}%</span>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
