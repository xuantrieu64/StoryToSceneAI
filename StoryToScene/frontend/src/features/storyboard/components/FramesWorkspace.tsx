import type { ReactNode } from 'react'
import { Image as ImageIcon, ImagePlus, LoaderCircle, PencilLine, RefreshCw, TriangleAlert, Users } from 'lucide-react'
import { TierToggle } from '@/features/characters/components/TierToggle'
import { tierById, type GenerationTierId } from '@/features/characters/data/generation-tiers'
import { remainingToday } from '@/features/characters/lib/generation-usage'
import { cn } from '@/lib/utils'
import { frameProgress, frameStats, frameStatus, shotsMissingFrames, TIER_DESCRIPTIONS, type FrameStatus } from '../lib/frames'
import { allShots, sceneCharacters, sceneTitle, type Shot, type Storyboard } from '../lib/storyboard-storage'
import { FrameCharacterPanel } from './FrameCharacterPanel'
import { ShotFrame } from './ShotFrame'

type FramesWorkspaceProps = {
  projectId: string
  storyboard: Storyboard
  now: number
  tier: GenerationTierId
  onTierChange: (tier: GenerationTierId) => void
  /** Tạo (hoặc tạo lại) ảnh cho các cú máy. */
  onGenerate: (shotNumbers: number[]) => void
  /** Mở hộp sửa chi tiết cú máy (đổi mô tả, tải ảnh…). */
  onEditShot: (shotNumber: number) => void
  /** Nhân vật thay đổi (thêm / sửa / xóa / ảnh mẫu) → đọc lại dữ liệu. */
  onCharactersChanged: () => void
  /** Chọn nhân vật xuất hiện trong một cú máy. */
  onShotCharactersChange: (shotNumber: number, names: string[]) => boolean
}

/**
 * Bước 6 – Khung hình (dùng chung cho tab "Khung hình" ở mục 5 và mục 6 trên Sidebar):
 * chọn chất lượng · nhân vật & ảnh mẫu · tiến độ · thẻ khung hình theo cảnh / cú máy của bảng phân cảnh.
 */
export function FramesWorkspace({ projectId, storyboard, now, tier, onTierChange, onGenerate, onEditShot, onCharactersChanged, onShotCharactersChange }: FramesWorkspaceProps) {
  const stats = frameStats(storyboard, now)
  const tierLabel = tierById(tier).label.toLocaleLowerCase('vi')
  const remaining = remainingToday(tier)
  const missing = shotsMissingFrames(storyboard, now)
  /** Thứ tự trong hàng chờ (nhãn "Chờ tạo · thứ k"). */
  const queue = allShots(storyboard)
    .filter((shot) => frameStatus(shot, now) === 'queued')
    .sort((a, b) => (a.frame?.startedAt ?? 0) - (b.frame?.startedAt ?? 0))
    .map((shot) => shot.number)

  return (
    <div className="space-y-4">
      {/* Chất lượng + lượt còn lại */}
      <section aria-label="Chất lượng tạo ảnh" className="rounded-xl border border-[#eceef1] bg-white p-4">
        <TierToggle onChange={onTierChange} tier={tier} />
        <p className="mb-0 mt-2.5 text-xs leading-5 text-[#6b7280]">
          {TIER_DESCRIPTIONS[tier]} Mỗi ảnh dùng 1 lượt {tierLabel}; ảnh giữ tới khi tạo lại.
        </p>
      </section>

      <FrameCharacterPanel
        now={now}
        onChanged={onCharactersChanged}
        onShotCharactersChange={onShotCharactersChange}
        projectId={projectId}
        storyboard={storyboard}
        tier={tier}
      />

      {/* Tổng hợp: x/y cú máy có ảnh · lượt còn lại · tạo cho các cú máy còn thiếu */}
      <section aria-label="Tiến độ khung hình" aria-live="polite" className="rounded-xl border border-[#eceef1] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#ecf8eb] text-[#39b536]">
              {stats.pending > 0 ? <LoaderCircle aria-hidden="true" className="size-[18px] animate-spin" /> : <ImageIcon aria-hidden="true" className="size-[18px]" />}
            </span>
            <div className="min-w-0">
              <p className="m-0 text-[15px] text-[#111827]">
                <b className="font-semibold">
                  {stats.ready}/{stats.total}
                </b>{' '}
                cú máy có ảnh
                {stats.pending > 0 && <span className="text-[13px] text-[#6b7280]"> · đang tạo {stats.pending} ảnh, khoảng {stats.secondsLeft} giây</span>}
              </p>
              <p className="mb-0 mt-0.5 text-xs leading-5 text-[#6b7280]">
                Mỗi ảnh dùng 1 lượt {tierLabel} · hôm nay còn{' '}
                <b className={cn('font-semibold', remaining === 0 ? 'text-[#dc2626]' : 'text-[#111827]')}>
                  {remaining}/{tierById(tier).dailyLimit}
                </b>{' '}
                · ảnh giữ tới khi tạo lại hoặc lập lại bảng
                {stats.failed > 0 && <span className="text-[#dc2626]"> · {stats.failed} ảnh lỗi, thử lại không tính lượt</span>}
              </p>
            </div>
          </div>
          <button
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#39b536] bg-white px-3.5 text-[13px] font-medium text-[#198c22] transition-colors hover:bg-[#ecf8eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536] disabled:cursor-not-allowed disabled:border-[#e5e7eb] disabled:text-[#9ca3af] disabled:hover:bg-white"
            disabled={missing.length === 0 || (remaining === 0 && stats.failed === 0)}
            onClick={() => onGenerate(missing)}
            type="button"
          >
            <ImagePlus aria-hidden="true" className="size-4" />
            {missing.length > 0 ? `Tạo ảnh cho ${missing.length} cú máy còn thiếu · ${tierLabel}` : stats.pending > 0 ? 'Đang tạo các ảnh còn lại…' : 'Mọi cú máy đã có ảnh'}
          </button>
        </div>
        <div
          aria-label={`${stats.ready}/${stats.total} cú máy có ảnh`}
          aria-valuemax={stats.total}
          aria-valuemin={0}
          aria-valuenow={stats.ready}
          className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-[#eef2ee]"
          role="progressbar"
        >
          <div className="h-full rounded-full bg-[#39b536] transition-[width] duration-500" style={{ width: `${(stats.ready / Math.max(1, stats.total)) * 100}%` }} />
        </div>
      </section>

      {/* Khung hình theo cảnh */}
      <div className="@container space-y-6 pt-1">
        {storyboard.scenes.map((scene) => {
          const names = sceneCharacters(scene)
          return (
            <section aria-label={sceneTitle(scene)} key={scene.id}>
              <h3 className="m-0 mb-3 flex flex-wrap items-baseline gap-x-2 text-sm font-semibold text-[#111827]">
                {sceneTitle(scene)}
                {names.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs font-normal text-[#6b7280]">
                    <Users aria-hidden="true" className="size-3.5" />
                    Nhân vật: {names.join(', ')}
                  </span>
                )}
              </h3>
              <ol className="m-0 grid list-none grid-cols-1 gap-3 p-0 @md:grid-cols-2 @min-[620px]:grid-cols-3">
                {scene.shots.map((shot) => (
                  <FrameCard
                    heading={scene.heading}
                    key={shot.id}
                    now={now}
                    onEdit={() => onEditShot(shot.number)}
                    onGenerate={() => onGenerate([shot.number])}
                    queuePosition={queue.indexOf(shot.number) + 1}
                    shot={shot}
                    tierLabel={tierLabel}
                  />
                ))}
              </ol>
            </section>
          )
        })}
      </div>
    </div>
  )
}

type FrameCardProps = { shot: Shot; heading: string; now: number; tierLabel: string; queuePosition: number; onGenerate: () => void; onEdit: () => void }

const STATUS_CHIP: Record<FrameStatus, { label: string; className: string }> = {
  none: { label: 'Chưa tạo ảnh', className: 'bg-[#f3f4f6] text-[#6b7280]' },
  queued: { label: 'Chờ tạo', className: 'bg-[#fffbeb] text-[#b45309]' },
  generating: { label: 'Đang tạo', className: 'bg-[#eff6ff] text-[#1d4ed8]' },
  ready: { label: 'Đã có ảnh', className: 'bg-[#ecf8eb] text-[#198c22]' },
  failed: { label: 'Lỗi', className: 'bg-[#fef2f2] text-[#dc2626]' },
}

/** Thẻ khung hình của một cú máy – trạng thái riêng: chưa tạo · chờ · đang tạo (tiến độ) · đã có ảnh · lỗi. */
function FrameCard({ shot, heading, now, tierLabel, queuePosition, onGenerate, onEdit }: FrameCardProps) {
  const status: FrameStatus = shot.image ? 'ready' : frameStatus(shot, now)
  const busy = status === 'queued' || status === 'generating'
  const progress = Math.round(frameProgress(shot, now) * 100)
  const badge = `${shot.number} · ${shot.size} · ${shot.duration} giây`

  return (
    <li
      aria-busy={busy}
      className={cn('flex min-w-0 flex-col rounded-xl border bg-white p-2.5', status === 'failed' ? 'border-[#fecaca]' : 'border-[#eceef1]')}
      id={`frame-${shot.number}`}
    >
      <div className="relative">
        {status === 'ready' ? (
          <ShotFrame heading={heading} shot={shot} />
        ) : status === 'failed' ? (
          <div className="grid aspect-video w-full place-items-center rounded-lg border border-dashed border-[#fecaca] bg-[#fff7f7] text-center">
            <span className="flex flex-col items-center px-3">
              <TriangleAlert aria-hidden="true" className="size-6 text-[#dc2626]" />
              <span className="mt-1.5 text-[13px] font-semibold text-[#991b1b]">Tạo ảnh thất bại</span>
              <button
                className="mt-2 inline-flex h-7 items-center gap-1 rounded-md bg-white px-2.5 text-xs font-medium text-[#991b1b] ring-1 ring-[#fecaca] transition-colors hover:bg-[#fef2f2] focus-visible:outline-2 focus-visible:outline-[#dc2626]"
                onClick={onGenerate}
                type="button"
              >
                <RefreshCw aria-hidden="true" className="size-3.5" />
                Thử lại · không tính lượt
              </button>
            </span>
          </div>
        ) : busy ? (
          <div className="grid aspect-video w-full place-items-center rounded-lg border border-dashed border-[#d6efd5] bg-[#f6fbf5] text-center">
            <span className="flex w-full flex-col items-center px-6">
              <LoaderCircle aria-hidden="true" className={cn('size-6 text-[#39b536]', status === 'generating' ? 'animate-spin' : 'opacity-50')} />
              <span className="mt-1.5 text-[13px] font-semibold text-[#111827]">{status === 'queued' ? `Chờ tạo · thứ ${queuePosition}` : `Đang tạo ảnh… ${progress}%`}</span>
              <span
                aria-label={`Tiến độ ${progress}%`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={progress}
                className="mt-2 block h-1 w-full max-w-[160px] overflow-hidden rounded-full bg-[#e5efe4]"
                role="progressbar"
              >
                <span className="block h-full rounded-full bg-[#39b536] transition-[width] duration-500" style={{ width: `${progress}%` }} />
              </span>
            </span>
          </div>
        ) : (
          <button
            aria-label={`Tạo ảnh cho cú máy ${shot.number}`}
            className="grid aspect-video w-full place-items-center rounded-lg border border-dashed border-[#d6efd5] bg-[#f6fbf5] text-center transition-colors hover:bg-[#ecf8eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]"
            onClick={onGenerate}
            type="button"
          >
            <span className="flex flex-col items-center">
              <ImagePlus aria-hidden="true" className="size-6 text-[#39b536]" />
              <span className="mt-1.5 text-[13px] font-semibold text-[#111827]">Tạo ảnh</span>
              <span className="text-[11px] text-[#6b7280]">1 lượt {tierLabel}</span>
            </span>
          </button>
        )}
        <span className="pointer-events-none absolute right-1.5 top-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium text-white">{badge}</span>
      </div>

      <p className="mb-0 mt-2.5 line-clamp-2 px-1 text-[13px] leading-5 text-[#1f2937]" title={shot.description}>
        {shot.description}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 px-1 pt-2.5">
        <span className={cn('inline-flex h-5 shrink-0 items-center rounded px-1.5 text-[11px] font-medium', STATUS_CHIP[status].className)}>
          {status === 'generating' ? `${STATUS_CHIP.generating.label} ${progress}%` : STATUS_CHIP[status].label}
        </span>
        <span className="min-w-0 flex-1 truncate text-[11px] text-[#9ca3af]">
          {shot.movement}
          {shot.characters.length > 0 && ` · ${shot.characters.join(', ')}`}
        </span>
        <span className="flex shrink-0 gap-0.5">
          {status === 'none' && (
            <CardAction label={`Tạo ảnh cú máy ${shot.number}`} onClick={onGenerate}>
              <ImagePlus className="size-3.5" />
            </CardAction>
          )}
          {status === 'ready' && (
            <CardAction label={`Tạo lại ảnh cú máy ${shot.number}`} onClick={onGenerate}>
              <RefreshCw className="size-3.5" />
            </CardAction>
          )}
          <CardAction disabled={busy} label={`Sửa cú máy ${shot.number} (mô tả, tải ảnh…)`} onClick={onEdit}>
            <PencilLine className="size-3.5" />
          </CardAction>
        </span>
      </div>
    </li>
  )
}

function CardAction({ label, onClick, disabled = false, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      aria-label={label}
      className="grid size-7 place-items-center rounded-md text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827] focus-visible:outline-2 focus-visible:outline-[#39b536] disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  )
}
