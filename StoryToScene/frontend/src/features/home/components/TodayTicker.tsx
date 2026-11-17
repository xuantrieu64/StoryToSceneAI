import { Sparkle } from 'lucide-react'
import { todayScenes } from '../data/home-content'
import { Container } from './shared/Container'

/** Thanh trạng thái dưới header: các kịch bản đã khởi tạo phân cảnh hôm nay. */
export function TodayTicker() {
  return (
    <div className="border-b border-slate-100 bg-white">
      <Container className="flex items-center gap-6 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <p className="flex shrink-0 items-center gap-2.5 text-[11px] leading-4 font-semibold tracking-[0.06em] text-slate-700 uppercase">
          <span aria-hidden="true" className="size-2 rounded-full bg-jade-500 shadow-[0_0_0_3px_rgb(0_176_116/0.18)]" />
          Phân cảnh đã khởi tạo <br className="hidden lg:block" />
          hôm nay:
        </p>
        {/* Desktop: các nhãn tự xuống 2 dòng như Figma · màn nhỏ: cả thanh cuộn ngang */}
        <ul className="flex min-w-max items-center gap-6 lg:min-w-0 lg:flex-1 lg:justify-between lg:gap-4">
          {todayScenes.map((scene) => (
            <li key={scene.title} className="flex items-center gap-3">
              <span className="text-[11px] leading-4 text-slate-400 lg:max-w-12">{scene.genre}:</span>
              <span className="max-w-24 text-xs leading-4 font-semibold text-slate-800">{scene.title}</span>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] leading-4 text-slate-500 tabular-nums lg:max-w-28">
                {scene.stats}
              </span>
            </li>
          ))}
        </ul>
        <p className="flex shrink-0 items-center gap-1.5 text-[11px] leading-4 font-semibold text-jade-600 lg:max-w-40">
          <Sparkle aria-hidden="true" className="size-3.5" />
          Engine Active • Final Draft® Ready
        </p>
      </Container>
    </div>
  )
}
