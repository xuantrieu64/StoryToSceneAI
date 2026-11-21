import { useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { CheckCircle2, Download, Film, LoaderCircle, TriangleAlert, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { clipStats, exportProgress, exportStatus } from '../lib/clips'
import { EXPORT_ASPECTS, EXPORT_QUALITIES, EXPORT_RESOLUTIONS, formatDuration, totalDuration, type ExportSettings, type Storyboard } from '../lib/storyboard-storage'

type ExportDialogProps = {
  open: boolean
  storyboard: Storyboard
  initial: ExportSettings
  now: number
  /** Số câu đã có giọng / tổng số câu. */
  voice: { ready: number; total: number }
  onClose: () => void
  onStart: (settings: ExportSettings) => void
  onDownloadEdl: () => void
}

/** Thiết lập & xuất phim (mô phỏng): tỉ lệ · độ phân giải · chất lượng · mức sẵn sàng · tiến trình · tải danh sách dựng. */
export function ExportDialog({ open, storyboard, initial, now, voice, onClose, onStart, onDownloadEdl }: ExportDialogProps) {
  const [settings, setSettings] = useState<ExportSettings>(initial)
  const stats = clipStats(storyboard, now)
  const status = exportStatus(storyboard, now)
  const job = storyboard.exportJob
  const missing = stats.total - stats.ready
  const progress = Math.round(exportProgress(storyboard, now) * 100)

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-slate-900/30" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-24px)] w-[min(calc(100vw-24px),520px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white font-sans shadow-2xl outline-none">
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#f1f5f9] px-6 py-5">
            <div>
              <Dialog.Title className="m-0 text-lg font-bold text-[#111827]">Xuất phim</Dialog.Title>
              <Dialog.Description className="m-0 mt-0.5 text-xs text-[#6b7280]">
                {storyboard.scenes.length} cảnh · {stats.total} cú máy · {formatDuration(totalDuration(storyboard))}
              </Dialog.Description>
            </div>
            <Dialog.Close aria-label="Đóng" className="grid size-8 shrink-0 place-items-center rounded-lg text-[#9ca3af] hover:bg-gray-50 hover:text-[#4b5563]">
              <X aria-hidden="true" className="size-5" />
            </Dialog.Close>
          </header>

          <div className="min-h-0 space-y-4 overflow-y-auto px-6 py-5">
            <Choice label="Tỉ lệ khung hình" onChange={(aspect) => setSettings((current) => ({ ...current, aspect }))} options={EXPORT_ASPECTS} value={settings.aspect} disabled={status === 'exporting'} />
            <Choice label="Độ phân giải" onChange={(resolution) => setSettings((current) => ({ ...current, resolution }))} options={EXPORT_RESOLUTIONS} value={settings.resolution} disabled={status === 'exporting'} />
            <Choice label="Chất lượng" onChange={(quality) => setSettings((current) => ({ ...current, quality }))} options={EXPORT_QUALITIES} value={settings.quality} disabled={status === 'exporting'} />

            {/* Mức sẵn sàng */}
            <div className="rounded-xl border border-[#eceef1] bg-[#fbfcfb] p-3.5 text-[13px] leading-5">
              <p className="m-0 flex items-center gap-2 text-[#111827]">
                <Film aria-hidden="true" className="size-4 text-[#39b536]" />
                <b className="font-semibold">
                  {stats.ready}/{stats.total}
                </b>{' '}
                cú máy đã có clip
                {stats.pending > 0 && <span className="text-[#6b7280]"> · {stats.pending} đang tạo</span>}
              </p>
              <p className="m-0 mt-1 pl-6 text-[#6b7280]">
                {voice.total > 0 ? `${voice.ready}/${voice.total} câu đã có giọng` : 'Tập không có lời thoại'}
              </p>
              {missing > 0 && (
                <p className="mb-0 mt-2 flex gap-2 text-[#b45309]">
                  <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  {missing} cú máy chưa có clip (hoặc cần tạo lại) sẽ dùng khung hình tĩnh trong bản xuất.
                </p>
              )}
            </div>

            {/* Trạng thái xuất */}
            {status === 'exporting' && (
              <div aria-live="polite" className="rounded-xl border border-[#bfdbfe] bg-[#eff6ff] p-3.5 text-[13px] text-[#1e40af]">
                <p className="m-0 flex items-center gap-2 font-semibold">
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                  Đang xuất phim… {progress}%
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-[#3b82f6] transition-[width] duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
            {status === 'done' && job && (
              <div aria-live="polite" className="rounded-xl border border-[#b9e3b6] bg-[#ecf8eb] p-3.5 text-[13px] text-[#14532d]">
                <p className="m-0 flex items-center gap-2 font-semibold">
                  <CheckCircle2 aria-hidden="true" className="size-4" />
                  Đã xuất xong (mô phỏng)
                </p>
                <p className="mb-0 mt-1 pl-6">
                  {job.settings.resolution} · {job.settings.aspect} · {job.settings.quality} · {job.clipsReady}/{job.clipsTotal} clip · {new Date(job.startedAt + job.durationMs).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <button
                  className="mt-2.5 inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#86cf83] bg-white px-3 text-xs font-medium text-[#198c22] hover:bg-[#f6fbf5]"
                  onClick={onDownloadEdl}
                  type="button"
                >
                  <Download aria-hidden="true" className="size-3.5" />
                  Tải danh sách dựng (.edl)
                </button>
                <p className="mb-0 mt-1.5 text-[11px] text-[#4b7a49]">Chưa ghép video thật ở giai đoạn này – file EDL mở được trong phần mềm dựng để ráp clip.</p>
              </div>
            )}
          </div>

          <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-[#f1f5f9] bg-[#f9fafb] px-6 py-4">
            <button className="min-h-10 rounded-lg border border-[#d1d5db] bg-white px-5 text-sm font-semibold text-[#374151] hover:bg-gray-50" onClick={onClose} type="button">
              Đóng
            </button>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#39b536] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#32a92f] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={status === 'exporting' || stats.total === 0}
              onClick={() => onStart(settings)}
              type="button"
            >
              <Film aria-hidden="true" className="size-4" />
              {status === 'done' ? 'Xuất lại' : 'Xác nhận xuất phim'}
            </button>
          </footer>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function Choice<T extends string>({ label, options, value, onChange, disabled }: { label: string; options: readonly T[]; value: T; onChange: (value: T) => void; disabled: boolean }) {
  return (
    <div>
      <p className="m-0 mb-1.5 text-xs font-bold text-[#334155]">{label}</p>
      <div aria-label={label} className="inline-flex flex-wrap rounded-lg bg-[#f3f4f6] p-1" role="radiogroup">
        {options.map((option) => (
          <button
            aria-checked={option === value}
            className={cn(
              'h-8 rounded-md px-3.5 text-[13px] transition-colors disabled:cursor-not-allowed',
              option === value ? 'bg-white font-semibold text-[#111827] shadow-sm' : 'text-[#6b7280] hover:text-[#374151]',
            )}
            disabled={disabled}
            key={option}
            onClick={() => onChange(option)}
            role="radio"
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
