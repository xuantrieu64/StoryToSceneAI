import type { LucideIcon } from 'lucide-react'
import { ChartNoAxesColumn, Check, Folder, Gauge, LayoutTemplate, MonitorPlay, Sparkles, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { comparisonRows, type ComparisonRowId, type SubscriptionPlan } from '../data/plans'

const rowIcons: Record<ComparisonRowId, LucideIcon> = {
  projects: Folder,
  aiCredits: Zap,
  resolution: MonitorPlay,
  templates: LayoutTemplate,
  priority: Gauge,
  earlyAccess: Sparkles,
}

export function FeatureComparison({ plans }: { plans: SubscriptionPlan[] }) {
  /** Tô nổi cột của gói nổi bật (giống trang chủ). */
  const highlightedPlan = plans.find((plan) => plan.featured)?.id
  return (
    <section aria-labelledby="feature-compare-title" className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xs max-sm:p-4">
      <h2 id="feature-compare-title" className="m-0 flex items-center gap-3 text-xl leading-7 font-bold text-slate-900">
        <ChartNoAxesColumn aria-hidden="true" className="size-6 text-jade-500" strokeWidth={2.5} />
        So sánh tính năng
      </h2>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm leading-5">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700" scope="col">
                Tính năng
              </th>
              {plans.map((plan) => (
                <th
                  className={cn(
                    'px-4 py-3 text-center font-semibold',
                    plan.id === highlightedPlan ? 'rounded-t-xl bg-jade-50 text-jade-600' : 'text-slate-700',
                  )}
                  key={plan.id}
                  scope="col"
                >
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, index) => {
              const Icon = rowIcons[row.id]
              const last = index === comparisonRows.length - 1
              return (
                <tr className="border-t border-slate-100" key={row.id}>
                  <th className="px-4 py-3 text-left font-normal text-slate-700" scope="row">
                    <span className="flex items-center gap-3">
                      <Icon aria-hidden="true" className="size-[18px] shrink-0 text-slate-600" strokeWidth={1.75} />
                      {row.label}
                    </span>
                  </th>
                  {plans.map((plan) => (
                    <td
                      className={cn(
                        'px-4 py-3 text-center whitespace-nowrap text-slate-700',
                        plan.id === highlightedPlan && 'bg-jade-50',
                        plan.id === highlightedPlan && last && 'rounded-b-xl',
                      )}
                      key={plan.id}
                    >
                      <CellValue value={row.value(plan)} />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <>
        <Check aria-hidden="true" className="mx-auto size-[18px] text-jade-500" strokeWidth={2.5} />
        <span className="sr-only">Có</span>
      </>
    )
  }
  if (value === false) {
    return (
      <>
        <span aria-hidden="true" className="text-slate-300">–</span>
        <span className="sr-only">Không</span>
      </>
    )
  }
  return <>{value}</>
}
