import { Lock } from 'lucide-react'
import { images, terminalDemo as t } from '../data/home-content'

const label = 'text-[11px] leading-4 font-semibold tracking-[0.08em] uppercase'

/** Khung minh họa giao diện Studio (tĩnh) ở Hero. */
export function StudioTerminal() {
  return (
    <figure
      aria-label="Minh họa Studio: AI phân tích một cảnh quay và viết kịch bản"
      className="overflow-hidden rounded-2xl bg-night-900 p-4 text-slate-300 shadow-[0_30px_60px_-20px_rgb(15_23_42/0.45)] ring-1 ring-white/5 sm:p-5"
    >
      {/* Thanh tiêu đề cửa sổ */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="size-2.5 rounded-full bg-[#febc2e]" />
            <span className="size-2.5 rounded-full bg-[#28c840]" />
          </span>
          <span className={`${label} text-slate-400`}>Studio v2.4 / Terminal</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 rounded-md bg-jade-500/15 px-2 py-1 text-[11px] leading-4 font-semibold text-jade-500">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-jade-500" />
            Engine Active
          </span>
          <span className={`${label} hidden text-slate-500 sm:inline`}>Scene-Analysis-AI</span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {/* Cột trái: khung hình + chỉ số kịch tính */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl ring-1 ring-white/10">
            <img src={images.terminalStill} alt="" width={512} height={279} className="absolute inset-0 size-full object-cover" />
            <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-night-900/90 via-night-900/10 to-transparent" />
            <div className="absolute top-2.5 left-2.5 flex items-center gap-2">
              <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] leading-4 font-bold text-white">REC • 24FPS</span>
              <span className="rounded bg-black/50 px-1.5 py-0.5 text-[10px] leading-4 font-medium text-slate-200">35mm T1.5</span>
            </div>
            <div className="absolute inset-x-2.5 bottom-2.5 flex items-end justify-between gap-2">
              <div>
                <p className="text-[11px] leading-4 font-semibold tracking-[0.04em] text-jade-500">{t.shot}</p>
                <p className="text-[10px] leading-4 text-slate-300">{t.shotNote}</p>
              </div>
              <span className="shrink-0 rounded bg-black/50 px-1.5 py-0.5 text-[11px] leading-4 font-semibold text-jade-500">{t.match}</span>
            </div>
          </div>

          <div className="rounded-xl bg-night-800 p-3.5 ring-1 ring-white/5">
            <div className="flex items-center justify-between">
              <span className={`${label} text-slate-300`}>Tỷ lệ kịch tính (Drama ratio)</span>
              <span className="text-xs leading-4 font-semibold text-jade-500 tabular-nums">{t.dramaRatio}%</span>
            </div>
            <div
              role="meter"
              aria-label="Tỷ lệ kịch tính"
              aria-valuenow={t.dramaRatio}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10"
            >
              <div className="h-full rounded-full bg-jade-500" style={{ width: `${t.dramaRatio}%` }} />
            </div>
            <div className="mt-2 flex justify-between gap-2 text-[10px] leading-4 text-slate-400">
              <span>{t.pace}</span>
              <span>{t.conflict}</span>
            </div>
          </div>
        </div>

        {/* Cột phải: đoạn kịch bản */}
        <div className="flex flex-col rounded-xl bg-night-800/60 p-4 ring-1 ring-white/5">
          <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
            <p className="text-xs leading-5 font-semibold text-jade-500">{t.scene}</p>
            <span className="shrink-0 text-[11px] leading-5 text-slate-500 tabular-nums">{t.timecode}</span>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-300">{t.action}</p>
          <div className="mt-3 text-center">
            <p className="text-xs leading-5 font-bold tracking-[0.08em] text-jade-500">{t.character}</p>
            <p className="text-[11px] leading-4 text-slate-500 italic">{t.parenthetical}</p>
            <p className="mt-1 text-xs leading-5 font-medium text-white">{t.dialogue}</p>
          </div>
          <div className="mt-auto flex items-start gap-2.5 border-t border-white/10 pt-3 text-[11px] leading-4">
            <span className="flex shrink-0 items-center gap-1 font-semibold text-jade-500">
              <Lock aria-hidden="true" className="size-3" />
              Auto-Shot List
            </span>
            <span className="text-slate-400">{t.extract}</span>
          </div>
        </div>
      </div>
    </figure>
  )
}
