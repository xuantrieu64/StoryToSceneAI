/**
 * Chất lượng tạo ảnh nhân vật và hạn mức mỗi ngày.
 * Lượt đã dùng được đếm trên trình duyệt theo ngày (xem lib/generation-usage.ts).
 * TODO(api): lấy hạn mức theo gói của tài khoản khi backend sẵn sàng.
 */
export type GenerationTierId = 'standard' | 'premium'

export const generationTiers: { id: GenerationTierId; label: string; dailyLimit: number }[] = [
  { id: 'standard', label: 'Thường', dailyLimit: 20 },
  { id: 'premium', label: 'Cao cấp', dailyLimit: 10 },
]

export const tierById = (id: GenerationTierId) => generationTiers.find((tier) => tier.id === id) ?? generationTiers[0]
