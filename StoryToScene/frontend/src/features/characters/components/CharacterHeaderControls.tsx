import { ChevronDown, Plus } from 'lucide-react'
import { scriptHeading, type Script } from '@/features/script/lib/script-storage'
import { type GenerationTierId } from '../data/generation-tiers'
import { TierToggle } from './TierToggle'

type CharacterHeaderControlsProps = {
  scripts: Script[]
  episodeId: string | null
  onEpisodeChange: (scriptId: string) => void
  tier: GenerationTierId
  onTierChange: (tier: GenerationTierId) => void
  onAdd: () => void
}

/** Cụm điều khiển bên phải tiêu đề: chọn Tập · chất lượng Thường / Cao cấp (hạn mức) · Thêm nhân vật. */
export function CharacterHeaderControls({ scripts, episodeId, onEpisodeChange, tier, onTierChange, onAdd }: CharacterHeaderControlsProps) {
  const hasScripts = scripts.length > 0

  return (
    <>
      {/* Bộ chọn tập */}
      <label className="flex min-w-0 items-center gap-2 text-[13px] text-[#6b7280]">
        Tập
        <span className="relative min-w-0">
          <select
            className="h-9 w-[220px] max-w-full cursor-pointer appearance-none truncate rounded-lg border border-[#e5e7eb] bg-white pl-3 pr-8 text-[13px] font-medium text-[#111827] outline-none transition-colors hover:border-[#d1d5db] focus:border-[#39b536] focus:ring-2 focus:ring-[#39b536]/15 disabled:cursor-not-allowed disabled:bg-[#f9fafb] disabled:text-[#9ca3af] max-[560px]:w-[180px]"
            disabled={!hasScripts}
            onChange={(event) => onEpisodeChange(event.target.value)}
            title={hasScripts ? 'Chọn tập để lấy gợi ý nhân vật' : 'Dự án chưa có tập kịch bản'}
            value={episodeId ?? ''}
          >
            {hasScripts ? (
              scripts.map((script) => (
                <option key={script.id} value={script.id}>
                  {scriptHeading(script)}
                </option>
              ))
            ) : (
              <option value="">Chưa có tập</option>
            )}
          </select>
          <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#6b7280]" />
        </span>
      </label>

      {/* Chất lượng tạo ảnh + hạn mức hôm nay */}
      <TierToggle onChange={onTierChange} tier={tier} />

      <button
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#39b536] px-4 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-[#32a92f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#198c22]"
        onClick={onAdd}
        type="button"
      >
        <Plus aria-hidden="true" className="size-4" strokeWidth={2.2} />
        Thêm nhân vật
      </button>
    </>
  )
}
