import { cn } from '@/lib/utils'
import { formatClock, formatDuration, sceneTitle, totalDuration } from '../lib/storyboard-storage'
import type { StoryboardViewProps } from './StoryboardViews'

/** Bề rộng tối thiểu cho mỗi giây – màn hẹp thì trục cuộn ngang thay vì ép khối quá nhỏ. */
const MIN_PX_PER_SECOND = 22
const DIALOGUE_COLOR = 'bg-[#3b82f6]'
const SOUND_COLOR = 'bg-[#86cf83]'

/** Bước chia trục: 5 giây, tập dài thì giãn ra để nhãn không chồng nhau. */
function tickStep(total: number) {
  if (total <= 90) return 5
  if (total <= 240) return 15
  if (total <= 600) return 30
  return 60
}

/**
 * Chế độ Timeline – "Nhịp phim": mỗi cảnh một hàng, cú máy là khối nằm ngang trên trục thời gian.
 * Vị trí / độ rộng khối tính theo % tổng thời lượng nên tự cập nhật khi thời lượng đổi (Storyboard,
 * Bảng chi tiết, chat và hộp sửa đều ghi chung một nguồn dữ liệu). Bấm khối → mở chi tiết để xem / sửa.
 */
export function ShotTimeline({ storyboard, selectedShot, highlightedShot, onOpenShot }: StoryboardViewProps) {
  const total = Math.max(1, totalDuration(storyboard))
  const step = tickStep(total)
  const ticks = Array.from({ length: Math.floor(total / step) + 1 }, (_, index) => index * step)
  const percent = (seconds: number) => `${(seconds / total) * 100}%`

  // Thời điểm bắt đầu của từng cú máy (liên tiếp qua các cảnh)
  const starts = new Map<string, number>()
  let cursor = 0
  for (const scene of storyboard.scenes) {
    for (const shot of scene.shots) {
      starts.set(shot.id, cursor)
      cursor += shot.duration
    }
  }

  const hasDialogue = storyboard.scenes.some((scene) => scene.shots.some((shot) => shot.dialogue))
  const hasSound = storyboard.scenes.some((scene) => scene.shots.some((shot) => shot.sound))

  return (
    <div>
      <p className="m-0 mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-[13px] font-bold uppercase tracking-[0.04em] text-[#111827]">Nhịp phim · {formatDuration(totalDuration(storyboard))}</span>
        <span className="text-xs text-[#6b7280]">Khối rộng theo thời lượng cú máy; bấm để xem chi tiết</span>
      </p>

      <div className="overflow-x-auto rounded-xl border border-[#eceef1] bg-white">
        <div className="grid grid-cols-[minmax(108px,160px)_1fr] max-[560px]:grid-cols-[92px_1fr]" style={{ minWidth: `calc(160px + ${total * MIN_PX_PER_SECOND}px)` }}>
          {/* Trục thời gian */}
          <div className="sticky left-0 z-10 border-b border-dashed border-[#e5e7eb] bg-white" />
          <div className="relative mr-5 ml-3 h-9 border-b border-dashed border-[#e5e7eb]" aria-hidden="true">
            {ticks.map((tick) => (
              <span
                className={cn('absolute top-2.5 text-[11px] tabular-nums text-[#9ca3af]', tick > 0 && '-translate-x-1/2')}
                key={tick}
                style={{ left: percent(tick) }}
              >
                {formatClock(tick)}
              </span>
            ))}
          </div>

          {/* Mỗi cảnh một hàng */}
          {storyboard.scenes.map((scene) => (
            <div className="contents" key={scene.id}>
              <div className="sticky left-0 z-10 flex items-center border-b border-[#f1f2f4] bg-white px-3 py-3 text-xs font-semibold leading-[18px] text-[#111827] last:border-b-0">
                <span className="line-clamp-3 break-words" title={sceneTitle(scene)}>
                  {sceneTitle(scene)}
                </span>
              </div>
              <div className="relative mr-5 ml-3 h-[76px] border-b border-[#f1f2f4]">
                {/* Vạch chia mờ theo trục */}
                {ticks.map((tick) => (
                  <span aria-hidden="true" className="absolute inset-y-0 w-px bg-[#f3f4f6]" key={tick} style={{ left: percent(tick) }} />
                ))}

                <ol className="m-0 list-none p-0">
                  {scene.shots.map((shot) => {
                    const start = starts.get(shot.id) ?? 0
                    const active = shot.number === selectedShot || shot.number === highlightedShot
                    return (
                      <li className="absolute inset-y-2 px-[2px]" key={shot.id} style={{ left: percent(start), width: percent(shot.duration) }}>
                        <button
                          aria-label={`Cú máy ${shot.number}, ${shot.size}, ${shot.duration} giây, bắt đầu ${formatClock(start)}${shot.dialogue ? ', có thoại' : ''}${shot.sound ? ', có âm thanh' : ''}. Mở chi tiết`}
                          className={cn(
                            'relative flex h-full w-full flex-col overflow-hidden rounded-lg border border-l-[3px] bg-[#f3faf2] px-2 pt-1.5 text-left transition-[border-color,box-shadow,background-color] hover:bg-[#e8f5e7] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#39b536]',
                            active ? 'border-[#39b536] shadow-[0_0_0_3px_rgba(57,181,54,0.15)]' : 'border-[#cfe9cd] border-l-[#39b536]',
                          )}
                          onClick={() => onOpenShot(shot.number)}
                          title={`${shot.description}\n${formatClock(start)}–${formatClock(start + shot.duration)}`}
                          type="button"
                        >
                          <span className="flex min-w-0 items-baseline gap-1.5 whitespace-nowrap">
                            <span className="text-[13px] font-bold text-[#111827]">{shot.number}</span>
                            <span className="text-[11px] tabular-nums text-[#6b7280]">{shot.duration}s</span>
                          </span>
                          <span className="block truncate text-[11px] text-[#4b5563]">{shot.size}</span>

                          {/* Đường thoại (xanh dương) / âm thanh (xanh lá nhạt) ở cạnh dưới */}
                          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 flex flex-col gap-px">
                            {shot.dialogue && <span className={cn('h-[3px]', DIALOGUE_COLOR)} />}
                            {shot.sound && <span className={cn('h-[3px]', SOUND_COLOR)} />}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(hasDialogue || hasSound) && (
        <ul aria-label="Chú thích" className="m-0 mt-3 flex list-none flex-wrap gap-x-5 gap-y-1 p-0 text-xs text-[#6b7280]">
          {hasDialogue && (
            <li className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className={cn('h-[3px] w-5 rounded-full', DIALOGUE_COLOR)} />
              Thoại
            </li>
          )}
          {hasSound && (
            <li className="inline-flex items-center gap-1.5">
              <span aria-hidden="true" className={cn('h-[3px] w-5 rounded-full', SOUND_COLOR)} />
              Âm thanh
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
