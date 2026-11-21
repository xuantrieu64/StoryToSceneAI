import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ChevronDown,
  Clapperboard,
  ClipboardList,
  Download,
  FileText,
  Film,
  GalleryHorizontal,
  Image as ImageIcon,
  LayoutGrid,
  Mic,
  PencilLine,
  RotateCcw,
  Table2,
} from 'lucide-react'
import { projectPaths } from '@/features/Dashboard/lib/project-display'
import { scriptHeading, type Script } from '@/features/script/lib/script-storage'
import { cn } from '@/lib/utils'
import type { GenerationTierId } from '@/features/characters/data/generation-tiers'
import { defaultExportSettings } from '../lib/clips'
import { downloadStoryboardExcel } from '../lib/export-storyboard'
import type { VoiceLine } from '../lib/voice'
import { allShots, formatDuration, sceneTitle, totalDuration, type ExportSettings, type ShotPatch, type Storyboard, type VideoSettings } from '../lib/storyboard-storage'
import { STORYBOARD_DAILY_LIMIT } from '../lib/storyboard-usage'
import { ShotEditorDialog } from './ShotEditorDialog'
import { DirectorPlanTab } from './StoryboardTabs'
import { VideoWorkspace } from './VideoWorkspace'
import { VoiceWorkspace } from './VoiceWorkspace'
import { ShotDetailTable } from './ShotDetailTable'
import { FramesWorkspace } from './FramesWorkspace'
import { ShotTimeline } from './ShotTimeline'
import { StoryboardGrid } from './StoryboardViews'

export type EpisodeStatus = 'none' | 'generating' | 'ready'

type StoryboardPanelProps = {
  projectId: string
  scripts: Script[]
  episode: Script | undefined
  status: EpisodeStatus
  storyboard: Storyboard | undefined
  /** Tập đang chọn có nội dung kịch bản để lập phân cảnh không. */
  hasContent: boolean
  remainingRuns: number
  highlightedShot: number | null
  onEpisodeChange: (scriptId: string) => void
  onGenerate: () => void
  /** Lưu thay đổi một cú máy của tập đang chọn; false = không lưu được. */
  onSaveShot: (shotNumber: number, patch: ShotPatch) => boolean
  /**
   * Tab gắn với một mục trên Sidebar: frames = mục 6 (/frames), voice = mục 7 (/voice); null = mục 5.
   * Bấm tab đó → sang route của mục; bấm tab khác khi đang ở mục 6/7 → về mục 5.
   */
  routeTab: RouteTab | null
  onOpenRouteTab: (tab: RouteTab) => void
  onLeaveRouteTab: () => void
  frames: {
    now: number
    tier: GenerationTierId
    onTierChange: (tier: GenerationTierId) => void
    onGenerateFrames: (shotNumbers: number[]) => void
    onCharactersChanged: () => void
    onShotCharactersChange: (shotNumber: number, names: string[]) => boolean
  }
  video: {
    onGenerateClips: (shotNumbers: number[]) => void
    onStartExport: (settings: ExportSettings) => void
    onVideoSettingsChange: (settings: VideoSettings) => void
  }
  voice: {
    onRead: (lines: VoiceLine[]) => void
    onSaveLineText: (line: VoiceLine, text: string) => boolean
    onSettingsChanged: () => void
  }
}

export type RouteTab = 'frames' | 'voice' | 'video'
const isRouteTab = (tab: ResultTab): tab is RouteTab => tab === 'frames' || tab === 'voice' || tab === 'video'

type ResultTab = 'storyboard' | 'frames' | 'voice' | 'video' | 'plan'
type BoardView = 'grid' | 'table' | 'timeline'

const RESULT_TABS: { id: ResultTab; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'storyboard', label: 'Bảng phân cảnh', icon: Table2 },
  { id: 'frames', label: 'Khung hình', icon: ImageIcon },
  { id: 'voice', label: 'Lồng tiếng', icon: Mic },
  { id: 'video', label: 'Video', icon: Film },
  { id: 'plan', label: 'Kế hoạch đạo diễn', icon: ClipboardList },
]

const BOARD_VIEWS: { id: BoardView; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'grid', label: 'Storyboard', icon: LayoutGrid },
  { id: 'table', label: 'Bảng chi tiết', icon: Table2 },
  { id: 'timeline', label: 'Timeline', icon: GalleryHorizontal },
]

/** Cột phải: chọn tập · tổng quan · tab kết quả · chế độ xem Storyboard / Bảng chi tiết / Timeline. */
export function StoryboardPanel(props: StoryboardPanelProps) {
  const { scripts, episode, status, storyboard, onEpisodeChange, onSaveShot, routeTab, frames, voice } = props
  /** Tab của mục 5 (không gồm Khung hình – tab đó gắn với route mục 6). */
  const [localTab, setLocalTab] = useState<Exclude<ResultTab, RouteTab>>('storyboard')
  const tab: ResultTab = routeTab ?? localTab
  const [view, setView] = useState<BoardView>('grid')
  /** Cú máy đang chọn (gắn với tập, đổi tập thì bỏ chọn). */
  const [selection, setSelection] = useState<{ scriptId: string; shot: number } | null>(null)
  /** `key` tăng mỗi lần mở để form sửa luôn lấy dữ liệu mới nhất. */
  const [editor, setEditor] = useState<{ shot: number; key: number } | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  const ready = status === 'ready' && storyboard !== undefined
  const selectedShot = selection && selection.scriptId === episode?.id ? selection.shot : null

  function selectShot(shotNumber: number) {
    if (episode) setSelection({ scriptId: episode.id, shot: shotNumber })
  }

  function openShot(shotNumber: number) {
    if (!episode) return
    selectShot(shotNumber)
    setEditor((current) => ({ shot: shotNumber, key: (current?.key ?? 0) + 1 }))
  }

  const editing = ready && editor ? findShot(storyboard, editor.shot) : null

  return (
    <section aria-label="Bảng phân cảnh" className="flex min-h-0 min-w-0 flex-col">
      <div className="shrink-0 border-b border-[#eceef1] px-6 pt-3 max-[760px]:px-4">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <label className="relative min-w-0">
            <span className="sr-only">Chọn tập</span>
            <Clapperboard aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6b7280]" />
            <select
              className="h-9 w-[280px] max-w-full cursor-pointer appearance-none truncate rounded-lg border border-[#e5e7eb] bg-white pl-9 pr-8 text-[13px] font-medium text-[#111827] outline-none transition-colors hover:border-[#d1d5db] focus:border-[#39b536] focus:ring-2 focus:ring-[#39b536]/15 disabled:cursor-not-allowed disabled:bg-[#f9fafb] disabled:text-[#9ca3af] max-[560px]:w-[200px]"
              disabled={scripts.length === 0}
              onChange={(event) => onEpisodeChange(event.target.value)}
              value={episode?.id ?? ''}
            >
              {scripts.length > 0 ? (
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
          </label>

          {ready && episode ? (
            <div className="flex items-center gap-2">
              <button
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3.5 text-[13px] font-medium text-[#374151] transition-colors hover:bg-[#f9fafb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]"
                onClick={() => openShot(selectedShot ?? allShots(storyboard)[0]?.number ?? 1)}
                title={selectedShot ? `Sửa cú máy ${selectedShot}` : 'Sửa cú máy đầu tiên (chọn thẻ để sửa cú máy khác)'}
                type="button"
              >
                <PencilLine aria-hidden="true" className="size-4" />
                Sửa tay
              </button>
              {routeTab === 'video' ? (
                <>
                  <span className="hidden h-9 items-center rounded-lg bg-[#f3f4f6] px-3 text-xs font-medium text-[#4b5563] min-[1100px]:inline-flex">
                    Tỉ lệ {defaultExportSettings(storyboard).aspect} · {defaultExportSettings(storyboard).resolution}
                  </span>
                  <button
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#39b536] px-3.5 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-[#32a92f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#198c22]"
                    onClick={() => setExportOpen(true)}
                    type="button"
                  >
                    <Film aria-hidden="true" className="size-4" />
                    Xuất phim
                  </button>
                </>
              ) : (
                <ExcelButton episode={episode} storyboard={storyboard} variant="primary" />
              )}
            </div>
          ) : (
            episode && (
              <p className="m-0 flex items-center gap-2 text-xs text-[#6b7280]">
                Trạng thái:
                <StatusBadge status={status} />
              </p>
            )
          )}
        </div>

        {ready ? (
          <>
            <Overview onRegenerate={props.onGenerate} regenerateDisabled={props.remainingRuns === 0} storyboard={storyboard} />
            <div aria-label="Kết quả phân cảnh" className="-mb-px mt-3 flex gap-6 overflow-x-auto max-[1100px]:gap-4" role="tablist">
              {RESULT_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  aria-selected={tab === id}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-[3px] pb-2.5 pt-1 text-[13px] transition-colors',
                    tab === id ? 'border-[#39b536] font-semibold text-[#111827]' : 'border-transparent text-[#6b7280] hover:text-[#374151]',
                  )}
                  key={id}
                  onClick={() => {
                    if (isRouteTab(id)) {
                      if (id !== routeTab) props.onOpenRouteTab(id)
                      return
                    }
                    setLocalTab(id)
                    if (routeTab) props.onLeaveRouteTab()
                  }}
                  role="tab"
                  type="button"
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="h-3" />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 max-[760px]:px-4" role={ready ? 'tabpanel' : undefined}>
        {ready ? (
          <>
            {tab === 'storyboard' && (
              <>
                <div aria-label="Chế độ xem" className="mb-4 inline-flex rounded-lg bg-[#f3f4f6] p-1" role="group">
                  {BOARD_VIEWS.map(({ id, label, icon: Icon }) => (
                    <button
                      aria-pressed={view === id}
                      className={cn(
                        'inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[13px] transition-colors',
                        view === id ? 'bg-white font-semibold text-[#111827] shadow-sm' : 'text-[#6b7280] hover:text-[#374151]',
                      )}
                      key={id}
                      onClick={() => setView(id)}
                      type="button"
                    >
                      <Icon aria-hidden="true" className="size-4" />
                      {label}
                    </button>
                  ))}
                </div>
                {view === 'grid' && <StoryboardGrid highlightedShot={props.highlightedShot} onOpenShot={openShot} selectedShot={selectedShot} storyboard={storyboard} />}
                {view === 'table' && (
                  <ShotDetailTable
                    highlightedShot={props.highlightedShot}
                    key={episode?.id}
                    onOpenShot={openShot}
                    onSaveShot={onSaveShot}
                    onSelectShot={selectShot}
                    selectedShot={selectedShot}
                    storyboard={storyboard}
                  />
                )}
                {view === 'timeline' && <ShotTimeline highlightedShot={props.highlightedShot} onOpenShot={openShot} selectedShot={selectedShot} storyboard={storyboard} />}
              </>
            )}
            {tab === 'frames' && (
              <FramesWorkspace
                now={frames.now}
                onCharactersChanged={frames.onCharactersChanged}
                onEditShot={openShot}
                onGenerate={frames.onGenerateFrames}
                onShotCharactersChange={frames.onShotCharactersChange}
                onTierChange={frames.onTierChange}
                projectId={props.projectId}
                storyboard={storyboard}
                tier={frames.tier}
              />
            )}
            {tab === 'voice' && (
              <VoiceWorkspace
                now={frames.now}
                onRead={voice.onRead}
                onSaveLineText={voice.onSaveLineText}
                onSettingsChanged={voice.onSettingsChanged}
                projectId={props.projectId}
                storyboard={storyboard}
              />
            )}
            {tab === 'video' && episode && (
              <VideoWorkspace
                episodeLabel={scriptHeading(episode)}
                exportOpen={exportOpen}
                key={episode.id}
                now={frames.now}
                onExportOpenChange={setExportOpen}
                onGenerateClips={props.video.onGenerateClips}
                onStartExport={props.video.onStartExport}
                onVideoSettingsChange={props.video.onVideoSettingsChange}
                projectId={props.projectId}
                storyboard={storyboard}
              />
            )}
            {tab === 'plan' && <DirectorPlanTab storyboard={storyboard} />}
          </>
        ) : (
          <PanelState {...props} />
        )}
      </div>

      {editing && editor && (
        <ShotEditorDialog
          heading={editing.scene.heading}
          key={editor.key}
          onClose={() => setEditor(null)}
          onSave={(patch) => {
            const saved = onSaveShot(editing.shot.number, patch)
            if (saved) setEditor(null)
            return saved
          }}
          open
          sceneTitle={sceneTitle(editing.scene)}
          shot={editing.shot}
        />
      )}
    </section>
  )
}

function ExcelButton({ storyboard, episode, variant }: { storyboard: Storyboard; episode: Script; variant: 'primary' | 'secondary' }) {
  return (
    <button
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#198c22]',
        variant === 'primary' ? 'bg-[#39b536] text-white shadow-sm hover:bg-[#32a92f]' : 'border border-[#e5e7eb] bg-white text-[#374151] hover:bg-[#f9fafb]',
      )}
      onClick={() => {
        downloadStoryboardExcel(storyboard, scriptHeading(episode))
        toast.success('Đã tải file Excel bảng phân cảnh')
      }}
      type="button"
    >
      <Download aria-hidden="true" className="size-4" />
      Tải file Excel
    </button>
  )
}

function findShot(storyboard: Storyboard, shotNumber: number) {
  for (const scene of storyboard.scenes) {
    const shot = scene.shots.find((item) => item.number === shotNumber)
    if (shot) return { scene, shot }
  }
  return null
}

function formatUpdated(iso: string) {
  const date = new Date(iso)
  const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  return date.toDateString() === new Date().toDateString() ? time : `${time} ${date.toLocaleDateString('vi-VN')}`
}

function Overview({ storyboard, onRegenerate, regenerateDisabled }: { storyboard: Storyboard; onRegenerate: () => void; regenerateDisabled: boolean }) {
  const strong = 'font-semibold text-[#111827]'
  const dot = <span aria-hidden="true">·</span>
  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[#6b7280]">
      <span>
        <b className={strong}>{storyboard.scenes.length}</b> cảnh
      </span>
      {dot}
      <span>
        <b className={strong}>{allShots(storyboard).length}</b> cú máy
      </span>
      {dot}
      <b className={strong}>{formatDuration(totalDuration(storyboard))}</b>
      {dot}
      <span>Khung {storyboard.aspectRatio}</span>
      {dot}
      <span>Cập nhật {formatUpdated(storyboard.updatedAt)}</span>
      <button
        className="ml-1 inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium text-[#6b7280] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827] disabled:cursor-not-allowed disabled:opacity-50"
        disabled={regenerateDisabled}
        onClick={onRegenerate}
        type="button"
      >
        <RotateCcw aria-hidden="true" className="size-3.5" />
        Lập lại
      </button>
    </div>
  )
}

/** Nội dung khi tập chưa có bảng: chưa có tập / tập trống / đang lập / chưa lập. */
function PanelState({ projectId, episode, status, hasContent, remainingRuns, onGenerate, routeTab }: StoryboardPanelProps) {
  if (!episode) {
    return (
      <EmptyState
        action={<LinkButton to={projectPaths.scripts(projectId)}>Mở Kịch bản</LinkButton>}
        description="Phân cảnh được lập từ từng tập kịch bản. Hãy tạo ít nhất một tập ở màn hình Kịch bản trước."
        icon={<FileText aria-hidden="true" className="size-6" />}
        title="Dự án chưa có tập kịch bản"
      />
    )
  }

  if (status === 'generating') {
    return (
      <div aria-live="polite" className="@container">
        <p className="m-0 mb-4 flex items-center gap-2 text-sm font-medium text-[#374151]">
          <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-[#39b536]" />
          Trợ lý đạo diễn đang đọc kịch bản và chia cú máy…
        </p>
        <span className="mb-3 block h-4 w-56 animate-pulse rounded bg-[#f3f4f6]" />
        <div className="grid grid-cols-1 gap-3 @md:grid-cols-2 @min-[620px]:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="animate-pulse rounded-xl border border-[#eceef1] p-2.5" key={index}>
              <span className="block aspect-video rounded-lg bg-[#f3f4f6]" />
              <span className="mt-3 block h-4 w-24 rounded bg-[#f3f4f6]" />
              <span className="mt-2 block h-3 w-full rounded bg-[#f3f4f6]" />
              <span className="mt-1.5 block h-3 w-2/3 rounded bg-[#f3f4f6]" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!hasContent) {
    return (
      <EmptyState
        action={<LinkButton to={projectPaths.scriptEditor(projectId, episode.id)}>Mở biên tập kịch bản</LinkButton>}
        description="Tập này chưa có cảnh, hành động hay lời thoại nào. Hãy viết kịch bản cho tập trước rồi quay lại lập phân cảnh."
        icon={<FileText aria-hidden="true" className="size-6" />}
        title={`${scriptHeading(episode)} chưa có nội dung`}
      />
    )
  }

  return (
    <EmptyState
      action={
        <button
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#39b536] px-5 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-[#32a92f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#198c22] disabled:cursor-not-allowed disabled:bg-[#a7dca5]"
          disabled={remainingRuns === 0}
          onClick={onGenerate}
          type="button"
        >
          <Clapperboard aria-hidden="true" className="size-4" />
          Lập bảng phân cảnh
        </button>
      }
      description={
        <>
          {routeTab === 'frames' && 'Khung hình được tạo cho từng cú máy của bảng phân cảnh (bước 5), nên cần lập bảng trước. '}
          {routeTab === 'video' && 'Video được dựng từ các cú máy của bảng phân cảnh (bước 5), nên cần lập bảng trước. '}
          {routeTab === 'voice' && 'Lồng tiếng đọc lời thoại và lời dẫn của từng cú máy trong bảng phân cảnh (bước 5), nên cần lập bảng trước. '}
          Trợ lý đạo diễn đọc kịch bản tập này, chia cảnh rồi viết từng cú máy: cỡ cảnh, chuyển động máy, thoại, âm thanh. Dùng 1 lượt AI, hôm nay
          còn{' '}
          <span className={cn('font-semibold', remainingRuns === 0 ? 'text-[#dc2626]' : 'text-[#111827]')}>
            {remainingRuns}/{STORYBOARD_DAILY_LIMIT}
          </span>
          .
        </>
      }
      icon={<Clapperboard aria-hidden="true" className="size-6" />}
      title={`${scriptHeading(episode)} chưa có bảng phân cảnh`}
    />
  )
}

function StatusBadge({ status }: { status: EpisodeStatus }) {
  const config = {
    none: { label: 'Chưa tạo phân cảnh', className: 'border-[#fde68a] bg-[#fffbeb] text-[#b45309]' },
    generating: { label: 'Đang lập…', className: 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]' },
    ready: { label: 'Đã có phân cảnh', className: 'border-[#b9e3b6] bg-[#ecf8eb] text-[#198c22]' },
  }[status]
  return <span className={cn('inline-flex h-6 items-center rounded-md border px-2 text-xs font-medium', config.className)}>{config.label}</span>
}

function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description: ReactNode; action: ReactNode }) {
  return (
    <div className="grid min-h-full place-items-center py-10">
      <div className="flex max-w-[400px] flex-col items-center text-center">
        <span className="grid size-14 place-items-center rounded-2xl border border-[#d6efd5] bg-[#ecf8eb] text-[#39b536]">{icon}</span>
        <h3 className="mb-0 mt-4 text-base font-bold leading-6 text-[#111827]">{title}</h3>
        <p className="mb-5 mt-1.5 text-[13px] leading-[22px] text-[#6b7280]">{description}</p>
        {action}
      </div>
    </div>
  )
}

function LinkButton({ to, children }: { to: string; children: string }) {
  return (
    <Link
      className="inline-flex h-10 items-center rounded-lg bg-[#39b536] px-5 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-[#32a92f]"
      to={to}
    >
      {children}
    </Link>
  )
}
