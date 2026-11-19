import { cn } from '@/lib/utils'
import { generationTiers, type GenerationTierId } from '../data/generation-tiers'
import { remainingByTier } from '../lib/generation-usage'

type TierToggleProps = {
  tier: GenerationTierId
  onChange: (tier: GenerationTierId) => void
  /** full: chiếm hết hàng (panel hẹp / màn hình nhỏ). */
  full?: boolean
}

/** Chọn chất lượng tạo ảnh Thường / Cao cấp, kèm số lượt còn lại hôm nay. */
export function TierToggle({ tier, onChange, full = false }: TierToggleProps) {
  const remaining = remainingByTier()

  return (
    <div aria-label="Chất lượng tạo ảnh" className={cn('inline-flex rounded-lg bg-[#f3f4f6] p-1 max-[560px]:w-full', full && 'w-full')} role="radiogroup">
      {generationTiers.map((option) => {
        const selected = option.id === tier
        return (
          <button
            aria-checked={selected}
            className={cn(
              'inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#39b536] max-[560px]:min-w-0 max-[560px]:flex-1 max-[560px]:justify-center',
              selected ? 'bg-white shadow-sm' : 'hover:bg-white/60',
              full && 'min-w-0 flex-1 justify-center',
            )}
            key={option.id}
            onClick={() => onChange(option.id)}
            role="radio"
            title={`${option.label}: còn ${remaining[option.id]}/${option.dailyLimit} lượt tạo ảnh hôm nay`}
            type="button"
          >
            <span className={cn('font-semibold', selected ? 'text-[#111827]' : 'text-[#4b5563]')}>{option.label}</span>
            <span className={cn(remaining[option.id] === 0 ? 'text-[#dc2626]' : selected ? 'text-[#39b536]' : 'text-[#9ca3af]')}>
              còn {remaining[option.id]}/{option.dailyLimit}
              <span className={cn('max-[560px]:hidden', full && 'hidden')}> hôm nay</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
