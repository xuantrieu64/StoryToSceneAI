import { cn } from '@/lib/utils'
import { YEARLY_DISCOUNT, type BillingCycle } from '../data/plans'

type BillingCycleToggleProps = {
  value: BillingCycle
  onChange: (value: BillingCycle) => void
}

export function BillingCycleToggle({ value, onChange }: BillingCycleToggleProps) {
  const option = (cycle: BillingCycle, label: string) => (
    <button
      aria-checked={value === cycle}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-full px-5 text-sm leading-5 font-semibold whitespace-nowrap transition-colors focus-visible:ring-3 focus-visible:ring-jade-500/40 focus-visible:outline-none max-sm:px-3.5 max-sm:text-[13px]',
        value === cycle
          ? 'bg-jade-500 text-white shadow-[0_8px_20px_-6px_rgb(0_176_116/0.55)]'
          : 'font-medium text-slate-700 hover:bg-slate-100',
      )}
      onClick={() => onChange(cycle)}
      role="radio"
      type="button"
    >
      {label}
      {cycle === 'yearly' && (
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs leading-4 font-semibold',
            value === 'yearly' ? 'bg-white/20 text-white' : 'bg-jade-50 text-jade-600',
          )}
        >
          Tiết kiệm {Math.round(YEARLY_DISCOUNT * 100)}%
        </span>
      )}
    </button>
  )

  return (
    <div aria-label="Chu kỳ thanh toán" className="flex flex-wrap items-center gap-1" role="radiogroup">
      {option('monthly', 'Thanh toán theo tháng')}
      {option('yearly', 'Thanh toán theo năm')}
    </div>
  )
}
