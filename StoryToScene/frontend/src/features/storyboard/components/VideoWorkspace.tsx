import { useCallback, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Check, Clapperboard, Download, Film, LoaderCircle, Play, RefreshCw, TriangleAlert, Users } from 'lucide-react'
import { ConfirmDeleteDialog } from '@/features/story/components/ConfirmDeleteDialog'
import { cn } from '@/lib/utils'
import {
  clipProgress,
  clipStats,
  clipStatus,
  defaultExportSettings,
  defaultVideoSettings,
  downloadEdl,
  exportProgress,
  exportStatus,
  lensFor,
  recordPlaceholderClip,
  remainingVideoCredits,
  shotsMissingClips,
  VIDEO_DAILY_LIMIT,
  VIDEO_MODELS,
  videoModelById,
  type ClipStatus,
} from '../lib/clips'
import { hasFrameImage } from '../lib/frames'
import { allShots, CLIP_LENGTHS, formatClock, sceneCharacters, sceneTitle, type ExportSettings, type Shot, type Storyboard, type VideoSettings } from '../lib/storyboard-storage'
import { voiceLines, voiceStatus } from '../lib/voice'
import { loadVoiceSettings } from '../lib/voice-settings'
import { ClipPreviewDialog } from './ClipPreviewDialog'
import { DraftPlayer } from './DraftPlayer'
import { ExportDialog } from './ExportDialog'
import { ShotFrame } from './ShotFrame'
import { VideoTimeline } from './VideoTimeline'

type VideoWorkspaceProps = {
  projectId: string
  storyboard: Storyboard
  /** "Tập 1: …" – tên file tải về. */
  episodeLabel: string
  now: number
  onGenerateClips: (shotNumbers: number[]) => void
  onStartExport: (settings: ExportSettings) => void
  /** Đổi model / độ dài clip của tập. */
  onVideoSettingsChange: (settings: VideoSettings) => void
  exportOpen: boolean
  onExportOpenChange: (open: boolean) => void
}

const STATUS: Record<ClipStatus, { label: string; chip: string }> = {
  none: { label: 'Chưa tạo clip', chip: 'bg-[#f3f4f6] text-[#6b7280]' },
  queued: { label: 'Chờ tạo', chip: 'bg-[#fffbeb] text-[#b45309]' },
  generating: { label: 'Đang tạo', chip: 'bg-[#eff6ff] text-[#1d4ed8]' },
  ready: { label: 'Clip xong', chip: 'bg-[#ecf8eb] text-[#198c22]' },
  outdated: { label: 'Cần tạo lại', chip: 'bg-[#fffbeb] text-[#b45309]' },
  failed: { label: 'Tạo thất bại', chip: 'bg-[#fef2f2] text-[#dc2626]' },
}

/** Tên file an toàn (bỏ dấu). */
const slug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'tap'

/**
 * Bước 8 – Video (dùng chung cho tab "Video" ở mục 5 và mục 8 trên Sidebar):
 * tổng quan clip · bản dựng 3 làn · danh sách cú máy theo cảnh · xem thử · xuất phim. Chỉ mô phỏng.
 */
export function VideoWorkspace({ projectId, storyboard, episodeLabel, now, onGenerateClips, onStartExport, onVideoSettingsChange, exportOpen, onExportOpenChange }: VideoWorkspaceProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [preview, setPreview] = useState<{ shot: number; key: number } | null>(null)
  const [recording, setRecording] = useState<Set<number>>(new Set())
  const [confirmAll, setConfirmAll] = useState(false)
  const voiceSettings = loadVoiceSettings(projectId)
  const stats = clipStats(storyboard, now)
  const missing = shotsMissingClips(storyboard, now)
  const shots = allShots(storyboard)
  const lines = voiceLines(storyboard)
  const voiceReady = lines.filter((line) => voiceStatus(line, voiceSettings, now) === 'ready').length
  const settings = defaultExportSettings(storyboard)
  const exporting = exportStatus(storyboard, now)
  const videoSettings = defaultVideoSettings(storyboard)
  const model = videoModelById(videoSettings.model)
  const remainingCredits = remainingVideoCredits()
  /** "Tạo lại tất cả": mọi cú máy không đang tạo. */
  const regenerable = shots.filter((shot) => {
    const status = clipStatus(shot, now)
    return status !== 'queued' && status !== 'generating'
  })

  const select = useCallback((shotNumber: number) => {
    setSelected(shotNumber)
    window.requestAnimationFrame(() => document.getElementById(`clip-${shotNumber}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
  }, [])

  const openPreview = (shotNumber: number) => {
    setSelected(shotNumber)
    setPreview((current) => ({ shot: shotNumber, key: (current?.key ?? 0) + 1 }))
  }

  async function download(shot: Shot, heading: string) {
    setRecording((current) => new Set(current).add(shot.number))
    const toastId = toast.loading(`Đang chuẩn bị clip cú máy ${shot.number}… (${shot.duration} giây)`)
    try {
      await recordPlaceholderClip(shot, heading, `${slug(episodeLabel)}-cu-may-${shot.number}.webm`)
      toast.success(`Đã tải clip cú máy ${shot.number}`, { id: toastId, description: 'Clip giữ chỗ (.webm) – chưa phải video AI.' })
    } catch (error) {
      toast.error('Không tạo được file clip', { id: toastId, description: error instanceof Error ? error.message : undefined })
    } finally {
      setRecording((current) => {
        const next = new Set(current)
        next.delete(shot.number)
        return next
      })
    }
  }

  const previewIndex = preview ? shots.findIndex((shot) => shot.number === preview.shot) : -1
  const previewShot = previewIndex >= 0 ? shots[previewIndex] : null
  const previewScene = previewShot ? storyboard.scenes.find((scene) => scene.shots.some((shot) => shot.id === previewShot.id)) : undefined
  const step = (offset: number) => {
    const target = shots[previewIndex + offset]
    return target ? () => openPreview(target.number) : null
  }

  return (
    <div className="space-y-4">
      {/* Thiết lập tạo video */}
      <section aria-label="Thiết lập video" className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-[#eceef1] bg-white px-4 py-3">
        <label className="flex items-center gap-2 text-xs text-[#6b7280]">
          Model
          <select
            className="h-8 cursor-pointer rounded-md border border-[#e5e7eb] bg-white px-2 text-xs font-medium text-[#111827] outline-none hover:border-[#d1d5db] focus:border-[#39b536] focus:ring-2 focus:ring-[#39b536]/15"
            onChange={(event) => onVideoSettingsChange({ ...videoSettings, model: event.target.value })}
            title={model.note}
            value={model.id}
          >
            {VIDEO_MODELS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label} · {option.credits} lượt
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-2 text-xs text-[#6b7280]">
          Thời lượng
          <div aria-label="Độ dài mỗi clip" className="inline-flex rounded-md bg-[#f3f4f6] p-0.5" role="radiogroup">
            {CLIP_LENGTHS.map((length) => (
              <button
                aria-checked={videoSettings.clipLength === length}
                className={cn(
                  'h-7 rounded px-2.5 text-xs transition-colors',
                  videoSettings.clipLength === length ? 'bg-[#39b536] font-semibold text-white shadow-sm' : 'text-[#4b5563] hover:bg-white/70',
                )}
                key={length}
                onClick={() => videoSettings.clipLength !== length && onVideoSettingsChange({ ...videoSettings, clipLength: length })}
                role="radio"
                type="button"
              >
                {length} giây
              </button>
            ))}
          </div>
        </div>
        <span className="flex items-center gap-2 text-xs text-[#6b7280]" title="Đổi tỉ lệ ở hộp Xuất phim">
          Khung
          <span className="inline-flex h-8 items-center rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-2.5 font-medium text-[#111827]">{settings.aspect} (theo dự án)</span>
        </span>
        <button
          className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#39b536] px-3.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#32a92f] disabled:cursor-not-allowed disabled:bg-[#a7dca5]"
          disabled={regenerable.length === 0 || remainingCredits < model.credits}
          onClick={() => setConfirmAll(true)}
          title={remainingCredits < model.credits ? 'Hết lượt tạo video hôm nay' : undefined}
          type="button"
        >
          <RefreshCw aria-hidden="true" className="size-3.5" />
          Tạo lại tất cả
        </button>
      </section>

      {/* Tổng quan + lượt dùng */}
      <section aria-label="Tổng quan video" aria-live="polite" className="rounded-xl border border-[#eceef1] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#ecf8eb] text-[#39b536]">
              {stats.pending > 0 ? <LoaderCircle aria-hidden="true" className="size-[18px] animate-spin" /> : <Film aria-hidden="true" className="size-[18px]" />}
            </span>
            <div className="min-w-0">
              <p className="m-0 text-[15px] text-[#111827]">
                <b className="font-semibold">
                  {stats.ready}/{stats.total}
                </b>{' '}
                cú máy có video
                {stats.pending > 0 && <span className="text-[13px] text-[#6b7280]"> · đang tạo {stats.pending} clip, khoảng {stats.secondsLeft} giây</span>}
                {stats.failed > 0 && <span className="text-[13px] text-[#dc2626]"> · {stats.failed} clip lỗi</span>}
                {stats.outdated > 0 && <span className="text-[13px] text-[#b45309]"> · {stats.outdated} cần tạo lại</span>}
              </p>
              <p className="mb-0 mt-0.5 text-xs leading-5 text-[#6b7280]">
                Clip {videoSettings.clipLength} giây (dài hơn cú máy thì tự cắt khi dựng) · {model.label} dùng {model.credits} lượt/clip · hôm nay còn{' '}
                <b className={cn('font-semibold', remainingCredits === 0 ? 'text-[#dc2626]' : 'text-[#111827]')}>
                  {remainingCredits}/{VIDEO_DAILY_LIMIT}
                </b>{' '}
                lượt · khung hình {shots.filter((shot) => hasFrameImage(shot, now)).length}/{shots.length} · giọng {voiceReady}/{lines.length} câu
                {exporting === 'exporting' && <span className="text-[#1d4ed8]"> · đang xuất phim {Math.round(exportProgress(storyboard, now) * 100)}%</span>}
                {exporting === 'done' && <span className="text-[#198c22]"> · đã xuất phim</span>}
              </p>
            </div>
          </div>
          <button
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#39b536] bg-white px-3.5 text-[13px] font-medium text-[#198c22] transition-colors hover:bg-[#ecf8eb] disabled:cursor-not-allowed disabled:border-[#e5e7eb] disabled:text-[#9ca3af] disabled:hover:bg-white"
            disabled={missing.length === 0}
            onClick={() => onGenerateClips(missing)}
            type="button"
          >
            <Clapperboard aria-hidden="true" className="size-4" />
            {missing.length > 0 ? `Tạo video cho ${missing.length} cú máy còn thiếu` : stats.pending > 0 ? 'Đang tạo các clip còn lại…' : 'Mọi cú máy đã có clip'}
          </button>
        </div>
        <div
          aria-label={`${stats.ready}/${stats.total} cú máy có video`}
          aria-valuemax={stats.total}
          aria-valuemin={0}
          aria-valuenow={stats.ready}
          className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-[#eef2ee]"
          role="progressbar"
        >
          <div className="h-full rounded-full bg-[#39b536] transition-[width] duration-500" style={{ width: `${(stats.ready / Math.max(1, stats.total)) * 100}%` }} />
        </div>
      </section>

      <DraftPlayer now={now} onSelectShot={select} selectedShot={selected} storyboard={storyboard} />

      <VideoTimeline now={now} onSelectShot={select} selectedShot={selected} storyboard={storyboard} voiceSettings={voiceSettings} />

      {/* Danh sách cú máy theo cảnh */}
      {storyboard.scenes.map((scene) => {
        const names = sceneCharacters(scene)
        const sceneReady = scene.shots.filter((shot) => clipStatus(shot, now) === 'ready').length
        return (
          <section aria-label={sceneTitle(scene)} key={scene.id}>
            <h3 className="m-0 mb-2.5 flex flex-wrap items-baseline gap-x-2 text-sm font-semibold text-[#111827]">
              {sceneTitle(scene)}
              {names.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-normal text-[#6b7280]">
                  <Users aria-hidden="true" className="size-3.5" />
                  Nhân vật: {names.join(', ')}
                </span>
              )}
              <span className="ml-auto text-xs font-normal text-[#9ca3af]">
                {sceneReady}/{scene.shots.length} clip xong
              </span>
            </h3>
            <ol className="m-0 list-none space-y-2.5 p-0">
              {scene.shots.map((shot) => (
                <ClipCard
                  heading={scene.heading}
                  key={shot.id}
                  now={now}
                  onDownload={() => void download(shot, sceneTitle(scene))}
                  onGenerate={() => onGenerateClips([shot.number])}
                  onPreview={() => openPreview(shot.number)}
                  onSelect={() => select(shot.number)}
                  recording={recording.has(shot.number)}
                  selected={shot.number === selected}
                  shot={shot}
                  voiceCount={lines.filter((line) => line.shot.id === shot.id).length}
                />
              ))}
            </ol>
          </section>
        )
      })}

      {preview && previewShot && (
        <ClipPreviewDialog
          heading={previewScene?.heading ?? ''}
          key={preview.key}
          onClose={() => setPreview(null)}
          onNext={step(1)}
          onPrev={step(-1)}
          open
          sceneTitle={previewScene ? sceneTitle(previewScene) : ''}
          shot={previewShot}
        />
      )}

      <ConfirmDeleteDialog
        confirmLabel="Tạo lại tất cả"
        description={`Tạo lại clip cho ${regenerable.length} cú máy bằng ${model.label} · ${videoSettings.clipLength} giây. Clip hiện có sẽ bị thay. Dùng tối đa ${regenerable.length * model.credits} lượt (clip lỗi thử lại không tính lượt), hôm nay còn ${remainingCredits}.`}
        onCancel={() => setConfirmAll(false)}
        onConfirm={() => {
          setConfirmAll(false)
          onGenerateClips(regenerable.map((shot) => shot.number))
        }}
        open={confirmAll}
        title="Tạo lại video cho cả tập?"
      />

      {exportOpen && (
        <ExportDialog
          initial={settings}
          now={now}
          onClose={() => onExportOpenChange(false)}
          onDownloadEdl={() => downloadEdl(storyboard, episodeLabel, `${slug(episodeLabel)}-ban-dung.edl`)}
          onStart={onStartExport}
          open
          storyboard={storyboard}
          voice={{ ready: voiceReady, total: lines.length }}
        />
      )}
    </div>
  )
}

type ClipCardProps = {
  shot: Shot
  heading: string
  now: number
  selected: boolean
  recording: boolean
  voiceCount: number
  onSelect: () => void
  onPreview: () => void
  onDownload: () => void
  onGenerate: () => void
}

/** Thẻ ngang của một cú máy: khung hình · thông tin · trạng thái clip · Xem / Tải / Tạo lại. */
function ClipCard({ shot, heading, now, selected, recording, voiceCount, onSelect, onPreview, onDownload, onGenerate }: ClipCardProps) {
  const status = clipStatus(shot, now)
  const busy = status === 'queued' || status === 'generating'
  const progress = Math.round(clipProgress(shot, now) * 100)
  const lens = lensFor(shot.size)

  return (
    <li
      className={cn(
        'flex gap-3.5 rounded-xl border bg-white p-2.5 transition-[border-color,box-shadow] max-[560px]:flex-col',
        selected ? 'border-[#39b536] shadow-[0_0_0_3px_rgba(57,181,54,0.12)]' : status === 'failed' ? 'border-[#fecaca]' : 'border-[#eceef1]',
      )}
      id={`clip-${shot.number}`}
    >
      <button aria-label={`Chọn cú máy ${shot.number}`} className="relative w-[168px] shrink-0 overflow-hidden rounded-lg max-[560px]:w-full" onClick={onSelect} type="button">
        <ShotFrame className="[&>span]:hidden" heading={heading} shot={shot} />
        <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-white">{formatClock(shot.duration)}</span>
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-white/65">
            <span className="flex flex-col items-center text-[11px] font-medium text-[#1e40af]">
              <LoaderCircle aria-hidden="true" className={cn('mb-1 size-5', status === 'generating' && 'animate-spin')} />
              {status === 'queued' ? 'Chờ tạo' : `Đang tạo ${progress}%`}
            </span>
          </span>
        )}
        {status === 'failed' && (
          <span className="absolute inset-0 grid place-items-center bg-[#fff7f7]/80">
            <span className="flex flex-col items-center text-[11px] font-medium text-[#991b1b]">
              <TriangleAlert aria-hidden="true" className="mb-1 size-5 text-[#dc2626]" />
              Tạo thất bại
            </span>
          </span>
        )}
        {status === 'ready' && (
          <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-[#39b536] text-white ring-2 ring-white">
            <Check aria-hidden="true" className="size-3" strokeWidth={3} />
          </span>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className="m-0 text-[13px] text-[#6b7280]">
          <span className="font-semibold text-[#111827]">Cú máy {shot.number}</span>
          {selected && <span aria-hidden="true" className="mx-1 inline-block size-1.5 -translate-y-px rounded-full bg-[#39b536]" />}
          <span className="mx-1.5">·</span>
          <span className="font-medium text-[#198c22]">{shot.size}</span>
          <span className="mx-1.5">·</span>
          {shot.duration} giây
        </p>
        <p className="mb-0 mt-1 line-clamp-2 text-[13px] leading-5 text-[#1f2937]" title={shot.description}>
          {shot.description}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
          <Chip className={STATUS[status].chip}>
            {status === 'ready' && shot.clip ? `Clip xong ${shot.clip.resolution}` : status === 'generating' ? `Đang tạo ${progress}%` : STATUS[status].label}
          </Chip>
          {!hasFrameImage(shot, now) && <Chip className="bg-[#f3f4f6] text-[#6b7280]">Khung tạm</Chip>}
          {voiceCount > 0 && <Chip className="bg-[#eff6ff] text-[#1d4ed8]">{voiceCount} câu thoại</Chip>}
          <span className="text-[#9ca3af]">
            {shot.movement} · {lens.lens} · {lens.aperture}
            {status === 'ready' && shot.clip && ` · ${videoModelById(shot.clip.model).label} · clip ${shot.clip.length ?? 5}s · seed ${shot.clip.seed}`}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 self-center max-[560px]:self-start">
        {status === 'ready' ? (
          <button
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors',
              selected ? 'border-[#39b536] bg-[#ecf8eb] text-[#198c22]' : 'border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]',
            )}
            onClick={onPreview}
            type="button"
          >
            <Play aria-hidden="true" className="size-3.5" />
            Xem
          </button>
        ) : (
          <button
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#b9e3b6] bg-[#f6fbf5] px-3 text-xs font-medium text-[#198c22] hover:bg-[#ecf8eb] disabled:cursor-progress disabled:opacity-60"
            disabled={busy}
            onClick={onGenerate}
            type="button"
          >
            <Clapperboard aria-hidden="true" className="size-3.5" />
            {busy ? 'Đang tạo…' : status === 'failed' ? 'Thử lại · không tính lượt' : status === 'outdated' ? 'Tạo lại video' : 'Tạo video'}
          </button>
        )}
        <IconButton disabled={status !== 'ready' || recording} label={recording ? 'Đang chuẩn bị file…' : `Tải clip cú máy ${shot.number} (.webm)`} onClick={onDownload}>
          {recording ? <LoaderCircle className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
        </IconButton>
        <IconButton disabled={status !== 'ready'} label={`Tạo lại video cú máy ${shot.number}`} onClick={onGenerate}>
          <RefreshCw className="size-3.5" />
        </IconButton>
      </div>
    </li>
  )
}

function Chip({ className, children }: { className: string; children: ReactNode }) {
  return <span className={cn('inline-flex h-5 items-center rounded px-1.5 font-medium', className)}>{children}</span>
}

function IconButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled: boolean; children: ReactNode }) {
  return (
    <button
      aria-label={label}
      className="grid size-8 place-items-center rounded-lg border border-[#e5e7eb] bg-white text-[#6b7280] transition-colors hover:bg-[#f9fafb] hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  )
}
