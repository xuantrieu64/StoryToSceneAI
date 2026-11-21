import { useEffect, useRef, useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, X } from 'lucide-react'
import { cameraTransform, lensFor } from '../lib/clips'
import { formatClock, type Shot } from '../lib/storyboard-storage'
import { ShotFrame } from './ShotFrame'

type ClipPreviewDialogProps = {
  open: boolean
  shot: Shot | null
  sceneTitle: string
  heading: string
  onClose: () => void
  /** Chuyển sang cú máy trước / sau (null = không có). */
  onPrev: (() => void) | null
  onNext: (() => void) | null
}

/**
 * Xem clip của cú máy (mô phỏng): khung hình chuyển động theo kiểu máy, phụ đề thoại / lời dẫn,
 * phát / tạm dừng / xem lại theo đúng thời lượng cú máy. Không phát video AI thật.
 */
export function ClipPreviewDialog({ open, shot, sceneTitle, heading, onClose, onPrev, onNext }: ClipPreviewDialogProps) {
  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(true)
  const elapsedRef = useRef(0)
  const duration = shot?.duration ?? 1

  useEffect(() => {
    if (!open || !playing) return
    let frame = 0
    let last = performance.now()
    const tick = (time: number) => {
      const next = Math.min(duration, elapsedRef.current + (time - last) / 1000)
      last = time
      elapsedRef.current = next
      setElapsed(next)
      if (next >= duration) setPlaying(false)
      else frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [open, playing, duration])

  if (!shot) return null
  const t = elapsed / duration
  const lens = lensFor(shot.size)
  const caption = shot.dialogue ? `${shot.character ?? ''}: “${shot.dialogue}”` : shot.narration ? shot.narration : null

  function restart() {
    elapsedRef.current = 0
    setElapsed(0)
    setPlaying(true)
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-slate-900/50" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-24px)] w-[min(calc(100vw-24px),760px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white font-sans shadow-2xl outline-none">
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#f1f5f9] px-5 py-4">
            <div className="min-w-0">
              <Dialog.Title className="m-0 text-lg font-bold text-[#111827]">
                Cú máy {shot.number} · {shot.size}
              </Dialog.Title>
              <Dialog.Description className="m-0 mt-0.5 truncate text-xs text-[#6b7280]">{sceneTitle}</Dialog.Description>
            </div>
            <Dialog.Close aria-label="Đóng" className="grid size-8 shrink-0 place-items-center rounded-lg text-[#9ca3af] hover:bg-gray-50 hover:text-[#4b5563]">
              <X aria-hidden="true" className="size-5" />
            </Dialog.Close>
          </header>

          <div className="min-h-0 overflow-y-auto p-5">
            {/* Khung xem */}
            <div className="relative overflow-hidden rounded-xl bg-black">
              <div className="origin-center will-change-transform" style={{ transform: cameraTransform(shot.movement, t, shot.number) }}>
                <ShotFrame className="rounded-none [&>span]:hidden" heading={heading} shot={shot} />
              </div>
              {caption && (
                <p className="absolute inset-x-6 bottom-5 m-0 rounded bg-black/60 px-3 py-1.5 text-center text-sm leading-6 text-white">{caption}</p>
              )}
              <span className="absolute left-3 top-3 rounded bg-black/55 px-1.5 py-0.5 text-[11px] font-medium text-white">
                Xem thử · {shot.clip?.resolution ?? '1080p'}
              </span>
            </div>

            {/* Điều khiển */}
            <div className="mt-3 flex items-center gap-3">
              <button
                aria-label={playing ? 'Tạm dừng' : elapsed >= duration ? 'Xem lại' : 'Phát'}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-[#39b536] text-white hover:bg-[#32a92f]"
                onClick={() => (elapsed >= duration ? restart() : setPlaying((value) => !value))}
                type="button"
              >
                {playing ? (
                  <Pause aria-hidden="true" className="size-4" fill="currentColor" />
                ) : elapsed >= duration ? (
                  <RotateCcw aria-hidden="true" className="size-4" />
                ) : (
                  <Play aria-hidden="true" className="ml-0.5 size-4" fill="currentColor" />
                )}
              </button>
              <div
                aria-label="Tiến độ"
                aria-valuemax={duration}
                aria-valuemin={0}
                aria-valuenow={Math.round(elapsed)}
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e5e7eb]"
                role="progressbar"
              >
                <div className="h-full rounded-full bg-[#39b536]" style={{ width: `${t * 100}%` }} />
              </div>
              <span className="shrink-0 text-xs tabular-nums text-[#6b7280]">
                {formatClock(Math.floor(elapsed))} / {formatClock(duration)}
              </span>
            </div>

            {/* Thông tin */}
            <p className="mb-0 mt-4 text-sm leading-6 text-[#1f2937]">{shot.description}</p>
            <dl className="mb-0 mt-3 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-[13px] leading-5 max-[480px]:grid-cols-1">
              <dt className="text-[#6b7280]">Máy quay</dt>
              <dd className="m-0 text-[#111827]">
                {shot.size} · {shot.movement} · {lens.lens} · {lens.aperture}
              </dd>
              <dt className="text-[#6b7280]">Thời lượng</dt>
              <dd className="m-0 text-[#111827]">{shot.duration} giây</dd>
              {shot.characters.length > 0 && (
                <>
                  <dt className="text-[#6b7280]">Nhân vật</dt>
                  <dd className="m-0 text-[#111827]">{shot.characters.join(', ')}</dd>
                </>
              )}
              {shot.sound && (
                <>
                  <dt className="text-[#6b7280]">Âm thanh</dt>
                  <dd className="m-0 text-[#111827]">{shot.sound}</dd>
                </>
              )}
              {shot.clip && (
                <>
                  <dt className="text-[#6b7280]">Clip</dt>
                  <dd className="m-0 text-[#111827]">
                    {shot.clip.resolution} · seed {shot.clip.seed}
                  </dd>
                </>
              )}
            </dl>
            <p className="mb-0 mt-3 text-[11px] text-[#9ca3af]">Bản xem thử mô phỏng từ khung hình và chuyển động máy – chưa phải video AI.</p>
          </div>

          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-[#f1f5f9] bg-[#f9fafb] px-5 py-3">
            <button
              className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-[13px] text-[#374151] hover:bg-white disabled:opacity-40"
              disabled={!onPrev}
              onClick={() => onPrev?.()}
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
              Cú trước
            </button>
            <button
              className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-[13px] text-[#374151] hover:bg-white disabled:opacity-40"
              disabled={!onNext}
              onClick={() => onNext?.()}
              type="button"
            >
              Cú sau
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </footer>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
