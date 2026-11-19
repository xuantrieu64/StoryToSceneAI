/*
 * Lượt tạo ảnh đã dùng hôm nay + chất lượng đang chọn (localStorage, mô phỏng hạn mức gói).
 * Sang ngày mới (theo giờ máy) thì lượt đã dùng tự về 0.
 */
import { generationTiers, tierById, type GenerationTierId } from '../data/generation-tiers'

const USAGE_KEY = 'storytoscene.generation-usage.v1'
const TIER_KEY = 'storytoscene.generation-tier.v1'

type Usage = { date: string; used: Record<GenerationTierId, number> }

function today() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function loadUsage(): Usage {
  const empty: Usage = { date: today(), used: { standard: 0, premium: 0 } }
  try {
    const parsed = JSON.parse(window.localStorage.getItem(USAGE_KEY) ?? 'null') as Partial<Usage> | null
    if (!parsed || parsed.date !== empty.date || !parsed.used) return empty
    return { date: empty.date, used: { standard: Number(parsed.used.standard) || 0, premium: Number(parsed.used.premium) || 0 } }
  } catch {
    return empty
  }
}

export function remainingToday(tier: GenerationTierId) {
  return Math.max(0, tierById(tier).dailyLimit - loadUsage().used[tier])
}

export const remainingByTier = () => Object.fromEntries(generationTiers.map((tier) => [tier.id, remainingToday(tier.id)])) as Record<GenerationTierId, number>

/** Dùng 1 lượt; false nếu đã hết lượt hôm nay hoặc không ghi được. */
export function consumeGeneration(tier: GenerationTierId): boolean {
  const usage = loadUsage()
  if (usage.used[tier] >= tierById(tier).dailyLimit) return false
  usage.used[tier] += 1
  try {
    window.localStorage.setItem(USAGE_KEY, JSON.stringify(usage))
    return true
  } catch {
    return false
  }
}

export function loadSelectedTier(): GenerationTierId {
  try {
    return window.localStorage.getItem(TIER_KEY) === 'premium' ? 'premium' : 'standard'
  } catch {
    return 'standard'
  }
}

export function saveSelectedTier(tier: GenerationTierId) {
  try {
    window.localStorage.setItem(TIER_KEY, tier)
  } catch {
    /* chỉ mất ghi nhớ lựa chọn */
  }
}
