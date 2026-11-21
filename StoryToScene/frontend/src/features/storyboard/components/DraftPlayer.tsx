import { useEffect, useRef, useState } from 'react'
import { Maximize, Minimize, Pause, Play, RotateCcw, TriangleAlert, Volume1, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { cameraTransform, clipStatus, videoModelById, type ClipStatus } from '../lib/clips'
import { allShots, formatClock, sceneTitle, totalDuration, type Storyboard } from '../lib/storyboard-storage'
import { ShotFrame } from './ShotFrame'

type DraftPlayerProps = {
  storyboard: Storyboard
  now: number
  selectedShot: number | null
  onSelectShot: (shotNumber: number) => void
}

const VOLUME_KEY = 'storytoscene.draft-volume.v1'

function readVolume() {
  try {
    const value = Number(window.localStorage.getItem(VOLUME_KEY))
    return window.localStorage.getItem(VOLUME_KEY) !== null && value >= 0 && value <= 1 ? value : 0.8
  } catch {
    return 0.8
  }
}

const THUMB_STATUS: Record<ClipStatus, { label: string; dot: string }> = {
  none: { label: 'Chưa có clip', dot: 'bg-[#d1d5db]' },
  queued: { label: 'Chờ tạo', dot: 'bg-[#f59e0b]' },
  generating: { label: 'Đang tạo', dot: 'bg-[#3b82f6] animate-pulse' },
  ready: { label: 'Clip xong', dot: 'bg-[#39b536]' },
  outdated: { label: 'Cần tạo lại', dot: 'bg-[#f59e0b]' },
  failed: { label: 'Lỗi', dot: 'bg-[#dc2626]' },
}

/**
 * Bản dựng nháp cả tập: phát nối tiếp clip của từng cú máy theo thứ tự bảng phân cảnh (mỗi clip cắt
 * đúng thời lượng cú máy). Mô phỏng từ khung hình + chuyển động máy + phụ đề – không phát video AI thật.
 * Cú máy chưa có clip hiện khung tĩnh kèm nhãn trạng thái.
 */
export function DraftPlayer({ storyboard, now, selectedShot, onSelectShot }: DraftPlayerProps) {
  const shots = allShots(storyboard)
  const total = Math.max(1, totalDuration(storyboard))
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(readVolume)
  const [muted, setMuted] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeRef = useRef(0)

  // Vị trí từng cú máy trên bản dựng
  const starts = shots.map((_, index) => shots.slice(0, index).reduce((sum, shot) => sum + shot.duration, 0))
  const currentIndex = Math.max(0, starts.findLastIndex((start) => time >= start - 1e-6))
  const current = shots[Math.min(currentIndex, shots.length - 1)]
  const scene = storyboard.scenes.find((item) => item.shots.some((shot) => shot.id === current?.id))
  const local = current ? Math.min(current.duration, time - starts[currentIndex]) : 0
  const status = current ? clipStatus(current, now) : 'none'

  useEffect(() => {
    timeRef.current = time
  }, [time])

  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last = performance.now()
    const tick = (stamp: number) => {
      const next = Math.min(total, timeRef.current + (stamp - last) / 1000)
      last = stamp
      timeRef.current = next
      setTime(next)
      if (next >= total) setPlaying(false)
      else frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, total])

  // Chọn cú máy ở nơi khác (timeline / danh sách) khi đang dừng → nhảy tới cú máy đó
  const [syncedSelection, setSyncedSelection] = useState(selectedShot)
  if (selectedShot !== syncedSelection) {
    setSyncedSelection(selectedShot)
    const index = shots.findIndex((shot) => shot.number === selectedShot)
    if (!playing && index >= 0 && index !== currentIndex) setTime(starts[index])
  }

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === containerRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  function seek(seconds: number) {
    const value = Math.min(total, Math.max(0, seconds))
    timeRef.current = value
    setTime(value)
  }

  function jumpTo(index: number) {
    seek(starts[index])
    onSelectShot(shots[index].number)
  }

  function changeVolume(value: number) {
    setVolume(value)
    setMuted(value === 0)
    try {
      window.localStorage.setItem(VOLUME_KEY, String(value))
    } catch {
      /* chỉ mất ghi nhớ âm lượng */
    }
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await containerRef.current?.requestFullscreen()
    } catch {
      /* trình duyệt chặn toàn màn hình */
    }
  }

  if (!current) return null
  const caption = current.dialogue ? `${current.character ?? ''}: “${current.dialogue}”` : current.narration ?? null
  const effectiveVolume = muted ? 0 : volume
  const VolumeIcon = effectiveVolume === 0 ? VolumeX : effectiveVolume < 0.5 ? Volume1 : Volume2
  const ended = time >= total

  return (
    <section aria-label="Bản dựng nháp" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="m-0 text-[13px] font-bold uppercase tracking-[0.04em] text-[#111827]">
          Bản dựng nháp <span className="ml-1.5 text-xs font-normal normal-case tracking-normal text-[#6b7280]">Bấm cú máy để xem · Phát thử chiếu tới hết tập</span>
        </p>
        <p className="m-0 text-xs text-[#6b7280]">
          Tổng thời lượng tập <b className="tabular-nums text-[#111827]">{formatClock(totalDuration(storyboard))}</b>
        </p>
      </div>

      {/* Trình phát */}
      <div className={cn('relative overflow-hidden rounded-xl bg-black text-white', fullscreen && 'grid place-items-center rounded-none')} ref={containerRef}>
        <div className={cn('relative w-full overflow-hidden', fullscreen && 'max-h-screen max-w-[calc(100vh*16/9)]')}>
          <div className="origin-center will-change-transform" style={{ transform: status === 'ready' ? cameraTransform(current.movement, local / current.duration, current.number) : 'none' }}>
            <ShotFrame className="rounded-none [&>span]:hidden" heading={scene?.heading ?? ''} shot={current} />
          </div>

          {/* Nhãn trên cùng */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 text-[11px] font-semibold">
            <span className="rounded bg-black/65 px-2 py-0.5">
              Cú máy {currentIndex + 1} / {shots.length}
            </span>
            {current.clip && status === 'ready' && <span className="rounded bg-[#39b536] px-2 py-0.5">{videoModelById(current.clip.model).label}</span>}
          </div>

          {/* Cú máy chưa có clip */}
          {status !== 'ready' && (
            <div className="absolute inset-0 grid place-items-center bg-black/45 text-center">
              <span className="flex flex-col items-center px-4 text-sm font-medium">
                {status === 'failed' && <TriangleAlert aria-hidden="true" className="mb-1.5 size-6 text-[#fca5a5]" />}
                {status === 'failed'
                  ? 'Clip tạo thất bại – đang hiện khung tĩnh'
                  : status === 'generating' || status === 'queued'
                    ? 'Clip đang được tạo – tạm hiện khung tĩnh'
                    : status === 'outdated'
                      ? 'Cú máy đã sửa – clip cần tạo lại'
                      : 'Chưa có clip – tạm hiện khung tĩnh'}
              </span>
            </div>
          )}

          {caption && <p className="absolute inset-x-8 bottom-20 m-0 rounded bg-black/60 px-3 py-1.5 text-center text-sm leading-6">{caption}</p>}

          {/* Điều khiển */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-3 pb-2.5 pt-8">
            <input
              aria-label="Tua bản dựng"
              className="h-1 w-full cursor-pointer accent-[#39b536]"
              max={total}
              min={0}
              onChange={(event) => seek(Number(event.target.value))}
              step={0.1}
              type="range"
              value={time}
            />
            <div className="mt-1.5 flex items-center gap-2.5">
              <button
                aria-label={playing ? 'Tạm dừng' : ended ? 'Phát lại từ đầu' : 'Phát thử'}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-white/15 px-3 text-xs font-semibold hover:bg-white/25"
                onClick={() => {
                  if (ended) seek(0)
                  setPlaying((value) => !value || ended)
                }}
                type="button"
              >
                {playing ? <Pause aria-hidden="true" className="size-3.5" fill="currentColor" /> : ended ? <RotateCcw aria-hidden="true" className="size-3.5" /> : <Play aria-hidden="true" className="size-3.5" fill="currentColor" />}
                {playing ? 'Tạm dừng' : ended ? 'Xem lại' : 'Phát thử'}
              </button>
              <span className="shrink-0 font-mono text-xs tabular-nums text-white/85">
                {formatClock(Math.floor(time))} / {formatClock(totalDuration(storyboard))}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-white/85">
                <b className="text-white">Cú máy {current.number}:</b> {scene ? sceneTitle(scene) : ''}
              </span>
              <span className="group/volume flex items-center gap-1.5">
                <button aria-label={muted ? 'Bật tiếng' : 'Tắt tiếng'} className="grid size-8 place-items-center rounded-md hover:bg-white/15" onClick={() => setMuted((value) => !value)} title="Âm lượng (mô phỏng – chưa có âm thanh thật)" type="button">
                  <VolumeIcon aria-hidden="true" className="size-4" />
                </button>
                <input
                  aria-label="Âm lượng"
                  className="h-1 w-20 cursor-pointer accent-[#39b536] max-[640px]:hidden"
                  max={1}
                  min={0}
                  onChange={(event) => changeVolume(Number(event.target.value))}
                  step={0.05}
                  type="range"
                  value={effectiveVolume}
                />
              </span>
              <button aria-label={fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'} className="grid size-8 place-items-center rounded-md hover:bg-white/15" onClick={() => void toggleFullscreen()} type="button">
                {fullscreen ? <Minimize aria-hidden="true" className="size-4" /> : <Maximize aria-hidden="true" className="size-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trình tự cú máy */}
      <div>
        <p className="m-0 mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6b7280]">Trình tự {shots.length} cú máy trong tập</p>
        <ol className="m-0 flex list-none gap-2 overflow-x-auto p-0 pb-1">
          {shots.map((shot, index) => {
            const itemStatus = clipStatus(shot, now)
            const active = index === currentIndex
            return (
              <li className="w-[112px] shrink-0" key={shot.id}>
                <button
                  aria-current={active ? 'true' : undefined}
                  aria-label={`Cú máy ${shot.number}, ${shot.duration} giây, ${THUMB_STATUS[itemStatus].label}`}
                  className={cn(
                    'relative block w-full overflow-hidden rounded-lg ring-offset-1 transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]',
                    active ? 'ring-2 ring-[#39b536]' : 'ring-1 ring-[#e5e7eb] hover:ring-[#b9e3b6]',
                  )}
                  onClick={() => jumpTo(index)}
                  title={`${THUMB_STATUS[itemStatus].label} · ${shot.description}`}
                  type="button"
                >
                  <ShotFrame className="rounded-none [&>span]:hidden" heading={storyboard.scenes.find((item) => item.shots.includes(shot))?.heading ?? ''} shot={shot} />
                  <span className="absolute bottom-1 left-1 rounded bg-black/65 px-1.5 py-px text-[10px] font-semibold tabular-nums text-white">
                    #{shot.number} · {shot.duration}s
                  </span>
                  <span aria-hidden="true" className={cn('absolute right-1.5 top-1.5 size-2 rounded-full ring-2 ring-white', THUMB_STATUS[itemStatus].dot)} />
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
