import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Mic, Pause, Play, SkipBack, Video, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { clipProgress, clipStatus, type ClipStatus } from '../lib/clips'
import { formatClock, sceneTitle, totalDuration, type Storyboard } from '../lib/storyboard-storage'
import { sceneVoiceLines, voiceStatus } from '../lib/voice'
import type { VoiceSetting } from '../lib/voice-settings'

type VideoTimelineProps = {
  storyboard: Storyboard
  now: number
  voiceSettings: Record<string, VoiceSetting>
  selectedShot: number | null
  onSelectShot: (shotNumber: number) => void
}

const MIN_PX_PER_SECOND = 26
const LABEL_WIDTH = 104

function tickStep(total: number) {
  if (total <= 60) return 5
  if (total <= 180) return 10
  if (total <= 600) return 30
  return 60
}

const CLIP_BLOCK: Record<ClipStatus, string> = {
  none: 'border-dashed border-[#d1d5db] bg-white text-[#6b7280]',
  queued: 'border-[#fcd34d] bg-[#fffbeb] text-[#92400e]',
  generating: 'border-[#93c5fd] bg-[#eff6ff] text-[#1e40af]',
  ready: 'border-[#86cf83] bg-[#ecf8eb] text-[#14532d]',
  outdated: 'border-[#fbbf24] bg-[#fffdf5] text-[#92400e]',
  failed: 'border-[#fca5a5] bg-[#fef2f2] text-[#991b1b]',
}

/**
 * Bản dựng dòng thời gian (3 làn): Video (clip từng cú máy) · Lồng tiếng (câu đọc) · Âm thanh (nền / hiệu ứng).
 * Vị trí / độ rộng theo % tổng thời lượng nên tự cập nhật khi thời lượng cú máy đổi. Vạch phát kéo được,
 * phát / tạm dừng chạy vạch theo thời gian thực và chọn cú máy dưới vạch.
 */
export function VideoTimeline({ storyboard, now, voiceSettings, selectedShot, onSelectShot }: VideoTimelineProps) {
  const total = Math.max(1, totalDuration(storyboard))
  const [playhead, setPlayhead] = useState(0)
  const [playing, setPlaying] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const percent = (seconds: number) => `${(seconds / total) * 100}%`

  // Thời điểm bắt đầu từng cú máy (liên tiếp qua các cảnh)
  const placed: { shot: Storyboard['scenes'][number]['shots'][number]; start: number; sceneIndex: number }[] = []
  const sceneStarts: { title: string; start: number }[] = []
  let cursor = 0
  storyboard.scenes.forEach((scene, sceneIndex) => {
    sceneStarts.push({ title: sceneTitle(scene), start: cursor })
    for (const shot of scene.shots) {
      placed.push({ shot, start: cursor, sceneIndex })
      cursor += shot.duration
    }
  })
  const shotAt = (seconds: number) => placed.find((item) => seconds >= item.start && seconds < item.start + item.shot.duration) ?? placed[placed.length - 1]

  // Âm thanh: gộp các cú máy liền nhau có cùng âm thanh thành một đoạn
  const soundSegments: { label: string; start: number; duration: number }[] = []
  for (const item of placed) {
    const label = item.shot.sound.trim()
    const last = soundSegments[soundSegments.length - 1]
    if (!label) continue
    if (last && last.label === label && last.start + last.duration === item.start) last.duration += item.shot.duration
    else soundSegments.push({ label, start: item.start, duration: item.shot.duration })
  }

  const step = tickStep(total)
  const ticks = Array.from({ length: Math.floor(total / step) + 1 }, (_, index) => index * step)

  // Phát: chạy vạch theo thời gian thực, dừng ở cuối
  const playheadRef = useRef(playhead)
  useEffect(() => {
    playheadRef.current = playhead
  }, [playhead])
  useEffect(() => {
    if (!playing) return
    let frame = 0
    let last = performance.now()
    const tick = (time: number) => {
      const next = Math.min(total, playheadRef.current + (time - last) / 1000)
      last = time
      playheadRef.current = next
      setPlayhead(next)
      if (next >= total) setPlaying(false)
      else frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, total])

  // Cú máy dưới vạch phát được chọn khi đang phát
  const underHead = shotAt(Math.min(playhead, total - 0.001))?.shot.number
  useEffect(() => {
    if (playing && underHead !== undefined && underHead !== selectedShot) onSelectShot(underHead)
  }, [playing, underHead, selectedShot, onSelectShot])

  // Chọn cú máy từ danh sách → đưa vạch về đầu cú máy đó (khi không phát)
  const selectedStart = placed.find((item) => item.shot.number === selectedShot)?.start
  const selectedEnd = selectedStart !== undefined ? selectedStart + (placed.find((item) => item.start === selectedStart)?.shot.duration ?? 0) : undefined
  const [syncedSelection, setSyncedSelection] = useState(selectedShot)
  if (selectedShot !== syncedSelection) {
    // Điều chỉnh state khi prop đổi (trong lúc render, theo khuyến nghị của React)
    setSyncedSelection(selectedShot)
    if (!playing && selectedStart !== undefined && selectedEnd !== undefined && !(playhead >= selectedStart && playhead < selectedEnd)) setPlayhead(selectedStart)
  }

  function seekFromPointer(event: ReactPointerEvent<HTMLElement>) {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return
    const seconds = Math.min(total, Math.max(0, ((event.clientX - rect.left) / rect.width) * total))
    setPlayhead(seconds)
    const item = shotAt(Math.min(seconds, total - 0.001))
    if (item) onSelectShot(item.shot.number)
  }

  const lanes = [
    { id: 'video', label: 'Video', icon: Video },
    { id: 'voice', label: 'Lồng tiếng', icon: Mic },
    { id: 'sound', label: 'Âm thanh', icon: Volume2 },
  ] as const

  return (
    <section aria-label="Bản dựng dòng thời gian" className="rounded-xl border border-[#eceef1] bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <button
            aria-label={playing ? 'Tạm dừng' : 'Phát bản dựng'}
            className="grid size-8 place-items-center rounded-full bg-[#39b536] text-white shadow-sm hover:bg-[#32a92f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#198c22]"
            onClick={() => {
              if (!playing && playhead >= total) setPlayhead(0)
              setPlaying((value) => !value)
            }}
            type="button"
          >
            {playing ? <Pause aria-hidden="true" className="size-3.5" fill="currentColor" /> : <Play aria-hidden="true" className="ml-0.5 size-3.5" fill="currentColor" />}
          </button>
          <button
            aria-label="Về đầu"
            className="grid size-8 place-items-center rounded-full text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]"
            onClick={() => {
              setPlaying(false)
              setPlayhead(0)
            }}
            type="button"
          >
            <SkipBack aria-hidden="true" className="size-3.5" />
          </button>
          <span className="text-xs font-semibold uppercase tracking-[0.04em] text-[#111827]">Bản dựng dòng thời gian · 3 làn</span>
          <span className="text-xs tabular-nums text-[#6b7280]">
            {formatClock(Math.floor(playhead))} / {formatClock(totalDuration(storyboard))}
          </span>
        </div>
        <ul aria-label="Chú thích" className="m-0 flex list-none flex-wrap gap-x-3.5 gap-y-1 p-0 text-[11px] text-[#6b7280]">
          {[
            ['Clip xong', 'bg-[#39b536]'],
            ['Đang tạo', 'bg-[#3b82f6]'],
            ['Chờ / chưa tạo', 'bg-[#d1d5db]'],
            ['Cần tạo lại', 'bg-[#f59e0b]'],
            ['Lỗi', 'bg-[#dc2626]'],
          ].map(([label, color]) => (
            <li className="inline-flex items-center gap-1.5" key={label}>
              <span aria-hidden="true" className={cn('size-2 rounded-full', color)} />
              {label}
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-x-auto">
        <div className="grid" style={{ gridTemplateColumns: `${LABEL_WIDTH}px 1fr`, minWidth: LABEL_WIDTH + total * MIN_PX_PER_SECOND }}>
          {/* Thước thời gian + mốc cảnh – bấm / kéo để di chuyển vạch phát */}
          <div />
          <div
            aria-label="Thước thời gian – bấm hoặc kéo để di chuyển vạch phát"
            aria-valuemax={total}
            aria-valuemin={0}
            aria-valuenow={Math.round(playhead)}
            className="relative mr-4 h-10 cursor-pointer touch-none select-none border-b border-dashed border-[#e5e7eb]"
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') setPlayhead((current) => Math.min(total, current + 1))
              if (event.key === 'ArrowLeft') setPlayhead((current) => Math.max(0, current - 1))
            }}
            onPointerDown={(event) => {
              setPlaying(false)
              event.currentTarget.setPointerCapture(event.pointerId)
              seekFromPointer(event)
            }}
            onPointerMove={(event) => event.currentTarget.hasPointerCapture(event.pointerId) && seekFromPointer(event)}
            ref={trackRef}
            role="slider"
            tabIndex={0}
          >
            {sceneStarts.map((scene) => (
              <span className="absolute top-0 max-w-[40%] truncate pl-1 text-[11px] font-semibold text-[#198c22]" key={scene.title} style={{ left: percent(scene.start) }} title={scene.title}>
                <span aria-hidden="true" className="mr-1 inline-block size-1.5 -translate-y-px rounded-full bg-[#39b536]" />
                {scene.title}
              </span>
            ))}
            {ticks.map((tick) => (
              <span className={cn('absolute bottom-1 text-[10px] tabular-nums text-[#9ca3af]', tick > 0 && '-translate-x-1/2')} key={tick} style={{ left: percent(tick) }}>
                {formatClock(tick)}
              </span>
            ))}
            <span aria-hidden="true" className="pointer-events-none absolute -bottom-1.5 z-10 size-3 -translate-x-1/2 rotate-45 rounded-[2px] bg-[#39b536] shadow" style={{ left: percent(playhead) }} />
          </div>

          {lanes.map(({ id, label, icon: Icon }) => (
            <div className="contents" key={id}>
              <div className="flex items-center gap-1.5 border-b border-[#f1f2f4] py-2 pr-2 text-xs font-medium text-[#374151]">
                <Icon aria-hidden="true" className="size-3.5 text-[#6b7280]" />
                {label}
              </div>
              <div className="relative mr-4 h-[52px] border-b border-[#f1f2f4]">
                {id === 'video' &&
                  placed.map(({ shot, start }) => {
                    const status = clipStatus(shot, now)
                    const active = shot.number === selectedShot
                    return (
                      <button
                        aria-label={`Cú máy ${shot.number}, ${shot.duration} giây, ${status === 'ready' ? 'clip xong' : status === 'generating' ? 'đang tạo' : status === 'outdated' ? 'cần tạo lại' : status === 'failed' ? 'tạo thất bại' : 'chưa có clip'}`}
                        aria-pressed={active}
                        className={cn(
                          'absolute inset-y-1.5 overflow-hidden rounded-md border px-1.5 text-left transition-shadow focus-visible:outline-2 focus-visible:outline-[#39b536]',
                          CLIP_BLOCK[status],
                          active && 'shadow-[0_0_0_2px_#39b536] ring-0',
                        )}
                        key={shot.id}
                        onClick={() => onSelectShot(shot.number)}
                        style={{ left: `calc(${percent(start)} + 1px)`, width: `calc(${percent(shot.duration)} - 2px)` }}
                        title={shot.description}
                        type="button"
                      >
                        {status === 'generating' && <span aria-hidden="true" className="absolute inset-y-0 left-0 bg-[#bfdbfe]/60" style={{ width: `${clipProgress(shot, now) * 100}%` }} />}
                        <span className="relative flex items-baseline gap-1 whitespace-nowrap pt-1">
                          <span className="text-[13px] font-bold">{shot.number}</span>
                          <span className="text-[10px] tabular-nums opacity-75">{shot.duration}s</span>
                        </span>
                        <span className="relative block truncate text-[10px] opacity-75">{shot.size}</span>
                      </button>
                    )
                  })}

                {id === 'voice' &&
                  storyboard.scenes.flatMap((scene) => {
                    const lines = sceneVoiceLines(scene)
                    return scene.shots.map((shot) => {
                      const shotLines = lines.filter((line) => line.shot.id === shot.id)
                      if (shotLines.length === 0) return null
                      const start = placed.find((item) => item.shot.id === shot.id)?.start ?? 0
                      const ready = shotLines.every((line) => voiceStatus(line, voiceSettings, now) === 'ready')
                      return (
                        <button
                          className={cn(
                            'absolute inset-y-2.5 overflow-hidden rounded-md px-1.5 text-left text-[10px] font-medium focus-visible:outline-2 focus-visible:outline-[#39b536]',
                            ready ? 'bg-[#3b82f6] text-white' : 'border border-dashed border-[#93c5fd] bg-[#eff6ff] text-[#1e40af]',
                          )}
                          key={shot.id}
                          onClick={() => onSelectShot(shot.number)}
                          style={{ left: `calc(${percent(start)} + 1px)`, width: `calc(${percent(shot.duration)} - 2px)` }}
                          title={shotLines.map((line) => `${line.speaker}: ${line.text}`).join('\n')}
                          type="button"
                        >
                          <span className="block truncate leading-[30px]">
                            {shotLines.length} câu · {shotLines.map((line) => line.speaker).join(', ')}
                            {!ready && ' · chưa đọc'}
                          </span>
                        </button>
                      )
                    })
                  })}

                {id === 'sound' &&
                  soundSegments.map((segment) => (
                    <span
                      className="absolute inset-y-2.5 overflow-hidden rounded-md bg-[#5f8f6a] px-1.5 text-[10px] font-medium leading-[30px] text-white"
                      key={`${segment.start}-${segment.label}`}
                      style={{ left: `calc(${percent(segment.start)} + 1px)`, width: `calc(${percent(segment.duration)} - 2px)` }}
                      title={`${segment.label} · ${formatClock(segment.start)}–${formatClock(segment.start + segment.duration)}`}
                    >
                      <span className="block truncate">{segment.label}</span>
                    </span>
                  ))}

                {/* Vạch phát */}
                <span aria-hidden="true" className="pointer-events-none absolute -top-px bottom-0 z-10 w-0.5 -translate-x-1/2 bg-[#39b536]" style={{ left: percent(playhead) }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
