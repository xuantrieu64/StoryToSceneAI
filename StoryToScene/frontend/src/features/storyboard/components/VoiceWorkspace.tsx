import { useEffect, useRef, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { AudioLines, BookOpen, Check, Download, LoaderCircle, Mic, PencilLine, RefreshCw, Users, Volume2 } from 'lucide-react'
import { loadCharacters, nameKey, referenceSample } from '@/features/characters/lib/character-storage'
import { cn } from '@/lib/utils'
import { sceneCharacters, sceneTitle, type Storyboard } from '../lib/storyboard-storage'
import {
  downloadPlaceholderWav,
  estimateSeconds,
  remainingVoiceChars,
  sceneVoiceLines,
  speakersOf,
  usedVoiceCharsToday,
  VOICE_DAILY_CHAR_LIMIT,
  voiceProgress,
  voiceStats,
  voiceStatus,
  linesToRead,
  type VoiceLine,
  type VoiceStatus,
} from '../lib/voice'
import { loadVoiceSettings, NARRATOR, saveVoiceSetting, speakerKey, VOICE_PRESETS, VOICE_SPEEDS, voiceSettingFor, type VoicePreset, type VoiceSetting } from '../lib/voice-settings'
import { CharacterSampleImage } from './CharacterSampleImage'

type VoiceWorkspaceProps = {
  projectId: string
  storyboard: Storyboard
  now: number
  /** Đọc (hoặc đọc lại) các câu. */
  onRead: (lines: VoiceLine[]) => void
  /** Sửa lời của một câu (ghi vào cú máy của bảng phân cảnh); false = không lưu được. */
  onSaveLineText: (line: VoiceLine, text: string) => boolean
  /** Thiết lập giọng đổi → đọc lại dữ liệu. */
  onSettingsChanged: () => void
}

const formatNumber = (value: number) => value.toLocaleString('vi-VN')

/**
 * Bước 7 – Lồng tiếng (dùng chung cho tab "Lồng tiếng" ở mục 5 và mục 7 trên Sidebar):
 * tổng quan ký tự · giọng theo người nói · câu đọc theo cảnh. Chỉ mô phỏng, không gọi TTS.
 */
export function VoiceWorkspace({ projectId, storyboard, now, onRead, onSaveLineText, onSettingsChanged }: VoiceWorkspaceProps) {
  const settings = loadVoiceSettings(projectId)
  const stats = voiceStats(storyboard, settings, now)
  const speakers = speakersOf(storyboard)
  const characters = loadCharacters(projectId).filter((character) => character.kind === 'character')
  const remaining = remainingVoiceChars()
  const toRead = linesToRead(storyboard, settings, now)

  if (stats.total === 0) {
    return (
      <div className="grid place-items-center py-14 text-center">
        <span className="grid size-14 place-items-center rounded-2xl border border-[#d6efd5] bg-[#ecf8eb] text-[#39b536]">
          <Mic aria-hidden="true" className="size-6" />
        </span>
        <h3 className="mb-0 mt-4 text-base font-bold text-[#111827]">Tập này chưa có lời thoại hay lời dẫn</h3>
        <p className="mb-0 mt-1.5 max-w-[380px] text-[13px] leading-[22px] text-[#6b7280]">
          Câu đọc được lấy từ cột Thoại và Lời dẫn của bảng phân cảnh. Thêm thoại ở Bảng chi tiết hoặc mở một cú máy để thêm lời dẫn.
        </p>
      </div>
    )
  }

  function changeSetting(speaker: string, patch: Partial<VoiceSetting>) {
    if (!saveVoiceSetting(projectId, speaker, { ...voiceSettingFor(settings, speaker), ...patch })) {
      toast.error('Không lưu được thiết lập giọng')
      return
    }
    onSettingsChanged()
  }

  const title =
    stats.pending > 0
      ? `Đang lồng tiếng · còn ${stats.pending} câu`
      : stats.ready === 0 && stats.outdated === 0
        ? 'Chưa có giọng nào'
        : `${stats.ready}/${stats.total} câu đã có giọng`
  const distinctVoices = new Set(speakers.map((item) => voiceSettingFor(settings, item.speaker).preset)).size

  return (
    <div className="space-y-4">
      {/* Tổng quan */}
      <section aria-label="Tổng quan lồng tiếng" aria-live="polite" className="rounded-xl border border-[#eceef1] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#ecf8eb] text-[#39b536]">
              {stats.pending > 0 ? <LoaderCircle aria-hidden="true" className="size-[18px] animate-spin" /> : <Mic aria-hidden="true" className="size-[18px]" />}
            </span>
            <div className="min-w-0">
              <p className="m-0 text-[15px] font-semibold text-[#111827]">
                {title}
                {stats.pending > 0 && <span className="text-[13px] font-normal text-[#6b7280]"> · khoảng {stats.secondsLeft} giây</span>}
                {stats.outdated > 0 && stats.pending === 0 && <span className="text-[13px] font-normal text-[#b45309]"> · {stats.outdated} câu cần đọc lại</span>}
              </p>
              <p className="mb-0 mt-0.5 text-xs leading-5 text-[#6b7280]">
                Tính theo số ký tự đọc · cả tập {formatNumber(stats.chars)} ký tự · hôm nay đã dùng {formatNumber(usedVoiceCharsToday())}, còn{' '}
                <b className={cn('font-semibold', remaining === 0 ? 'text-[#dc2626]' : 'text-[#111827]')}>
                  {formatNumber(remaining)}/{formatNumber(VOICE_DAILY_CHAR_LIMIT)}
                </b>{' '}
                ký tự · file giữ tới khi đọc lại hoặc lập lại bảng
              </p>
            </div>
          </div>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#39b536] px-4 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#32a92f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#198c22] disabled:cursor-not-allowed disabled:bg-[#a7dca5]"
            disabled={toRead.length === 0 || remaining === 0}
            onClick={() => onRead(toRead)}
            title={toRead.length === 0 ? 'Mọi câu đã có hoặc đang đọc giọng' : `Đọc ${toRead.length} câu chưa có giọng / cần đọc lại`}
            type="button"
          >
            <Mic aria-hidden="true" className="size-4" />
            {toRead.length > 0 ? `Lồng tiếng cả tập · ${formatNumber(stats.toReadChars)} ký tự` : stats.pending > 0 ? 'Đang lồng tiếng…' : 'Đã lồng tiếng cả tập'}
          </button>
        </div>
        <div
          aria-label={`${stats.ready}/${stats.total} câu đã có giọng`}
          aria-valuemax={stats.total}
          aria-valuemin={0}
          aria-valuenow={stats.ready}
          className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-[#eef2ee]"
          role="progressbar"
        >
          <div className="h-full rounded-full bg-[#39b536] transition-[width] duration-500" style={{ width: `${(stats.ready / Math.max(1, stats.total)) * 100}%` }} />
        </div>
      </section>

      {/* Giọng nhân vật */}
      <section aria-label="Giọng nhân vật" className="rounded-xl border border-[#eceef1] bg-white p-4">
        <h3 className="m-0 text-sm font-semibold text-[#111827]">
          Giọng nhân vật{' '}
          <span className="ml-1 text-xs font-normal text-[#6b7280]">Tự nhận từ cột Thoại · nhớ theo dự án · đổi giọng thì các câu của nhân vật đó cần đọc lại</span>
        </h3>
        <ul className="m-0 mt-3 list-none space-y-2 p-0">
          {speakers.map((item) => {
            const setting = voiceSettingFor(settings, item.speaker)
            const narrator = speakerKey(item.speaker) === speakerKey(NARRATOR)
            const character = characters.find((entry) => nameKey(entry.name) === nameKey(item.speaker))
            return (
              <li className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-[#eceef1] bg-[#fbfcfb] px-3 py-2.5" key={item.speaker}>
                {narrator ? (
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f3f4f6] text-[#4b5563]">
                    <BookOpen aria-hidden="true" className="size-4" />
                  </span>
                ) : (
                  <CharacterSampleImage
                    className="size-9 shrink-0 rounded-full text-sm ring-1 ring-[#e5e7eb]"
                    name={item.speaker}
                    sample={character ? referenceSample(character, now) : null}
                  />
                )}
                <div className="min-w-[120px] flex-1">
                  <p className="m-0 text-[13px] font-semibold text-[#111827]">{item.speaker}</p>
                  <p className="m-0 text-[11px] text-[#6b7280]">
                    {item.lines} câu · {formatNumber(item.chars)} ký tự
                    {!narrator && !character && <span className="text-[#b45309]"> · chưa có ở mục Nhân vật</span>}
                  </p>
                </div>
                <label className="relative">
                  <span className="sr-only">Kiểu giọng của {item.speaker}</span>
                  <select
                    className="h-8 w-[156px] cursor-pointer appearance-none rounded-md border border-[#e5e7eb] bg-white pl-2.5 pr-7 text-xs font-medium text-[#111827] outline-none hover:border-[#d1d5db] focus:border-[#39b536] focus:ring-2 focus:ring-[#39b536]/15"
                    onChange={(event) => changeSetting(item.speaker, { preset: event.target.value as VoicePreset })}
                    value={setting.preset}
                  >
                    {VOICE_PRESETS.map((preset) => (
                      <option key={preset}>{preset}</option>
                    ))}
                  </select>
                  <AudioLines aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-[#9ca3af]" />
                </label>
                <div aria-label={`Tốc độ đọc của ${item.speaker}`} className="inline-flex rounded-md bg-[#f3f4f6] p-0.5" role="radiogroup">
                  {VOICE_SPEEDS.map((speed) => (
                    <button
                      aria-checked={setting.speed === speed.id}
                      className={cn(
                        'h-7 rounded px-2.5 text-xs transition-colors',
                        setting.speed === speed.id ? 'bg-[#39b536] font-semibold text-white shadow-sm' : 'text-[#4b5563] hover:bg-white/70',
                      )}
                      key={speed.id}
                      onClick={() => setting.speed !== speed.id && changeSetting(item.speaker, { speed: speed.id })}
                      role="radio"
                      type="button"
                    >
                      {speed.label}
                    </button>
                  ))}
                </div>
                <PreviewButton speaker={item.speaker} />
              </li>
            )
          })}
        </ul>
        <p className="mb-0 mt-2.5 text-xs text-[#6b7280]">
          Hiện có <b className="text-[#111827]">{distinctVoices}</b> kiểu giọng đang dùng cho {speakers.length} người nói.
        </p>
      </section>

      {/* Câu đọc theo cảnh */}
      {storyboard.scenes.map((scene) => {
        const lines = sceneVoiceLines(scene)
        if (lines.length === 0) return null
        const names = sceneCharacters(scene)
        return (
          <section aria-label={sceneTitle(scene)} className="rounded-xl border border-[#eceef1] bg-white p-4" key={scene.id}>
            <h3 className="m-0 mb-3 flex flex-wrap items-baseline gap-x-2 border-b border-[#f1f2f4] pb-2.5 text-sm font-semibold text-[#111827]">
              {sceneTitle(scene)}
              {names.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-normal text-[#6b7280]">
                  <Users aria-hidden="true" className="size-3.5" />
                  Nhân vật: {names.join(', ')}
                </span>
              )}
            </h3>
            <ul className="m-0 list-none space-y-2 p-0">
              {lines.map((line) => (
                <VoiceLineRow
                  key={line.id}
                  line={line}
                  now={now}
                  onRead={() => onRead([line])}
                  onSaveText={(text) => onSaveLineText(line, text)}
                  setting={voiceSettingFor(settings, line.speaker)}
                  status={voiceStatus(line, settings, now)}
                />
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

/** Nghe thử giọng – chỉ mô phỏng (chưa có TTS): hiện trạng thái "đang phát" trong chốc lát. */
function PreviewButton({ speaker }: { speaker: string }) {
  const [playing, setPlaying] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return (
    <button
      aria-label={playing ? `Đang phát thử giọng ${speaker}` : `Nghe thử giọng ${speaker}`}
      className={cn(
        'grid size-8 place-items-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-[#39b536]',
        playing ? 'bg-[#ecf8eb] text-[#39b536]' : 'text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]',
      )}
      onClick={() => {
        setPlaying(true)
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setPlaying(false), 1600)
      }}
      title="Nghe thử (mô phỏng – chưa có âm thanh thật)"
      type="button"
    >
      <Volume2 aria-hidden="true" className={cn('size-4', playing && 'animate-pulse')} />
    </button>
  )
}

type VoiceLineRowProps = {
  line: VoiceLine
  status: VoiceStatus
  setting: VoiceSetting
  now: number
  onRead: () => void
  onSaveText: (text: string) => boolean
}

const STATUS_LABEL: Record<VoiceStatus, { label: string; dot: string; chip: string }> = {
  none: { label: 'Chưa có giọng', dot: 'bg-[#d1d5db]', chip: 'bg-[#f3f4f6] text-[#6b7280]' },
  queued: { label: 'Chờ đọc', dot: 'bg-[#f59e0b]', chip: 'bg-[#fffbeb] text-[#b45309]' },
  generating: { label: 'Đang đọc', dot: 'bg-[#3b82f6] animate-pulse', chip: 'bg-[#eff6ff] text-[#1d4ed8]' },
  ready: { label: 'Đã có giọng', dot: 'bg-[#39b536]', chip: 'bg-[#ecf8eb] text-[#198c22]' },
  outdated: { label: 'Cần đọc lại', dot: 'bg-[#f59e0b]', chip: 'bg-[#fffbeb] text-[#b45309]' },
}

/** Một câu đọc: người nói (cách nói) · cú máy · ký tự · trạng thái · Đọc / tải / đọc lại · sửa lời. */
function VoiceLineRow({ line, status, setting, now, onRead, onSaveText }: VoiceLineRowProps) {
  const [editing, setEditing] = useState<string | null>(null)
  const busy = status === 'queued' || status === 'generating'
  const progress = Math.round(voiceProgress(line, now) * 100)
  const seconds = estimateSeconds(line.chars, setting)
  const config = STATUS_LABEL[status]

  function save() {
    if (editing === null) return
    const text = editing.trim()
    if (!text) {
      toast.error('Lời đọc không được để trống')
      return
    }
    if (text === line.text || onSaveText(text)) setEditing(null)
  }

  return (
    <li className={cn('rounded-lg border px-3 py-2.5', status === 'outdated' ? 'border-[#fde68a] bg-[#fffdf5]' : 'border-[#eceef1] bg-white')}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', config.dot)} />
        <p className="m-0 min-w-0 flex-1 text-[13px]">
          <span className="font-semibold text-[#111827]">{line.speaker}</span>
          {line.delivery && <span className="text-[#6b7280]"> ({line.delivery})</span>}
          <span className="ml-2 text-xs text-[#9ca3af]">
            Cú máy {line.shot.number} · {line.chars} ký tự · ~{seconds}s
          </span>
        </p>
        <span className={cn('inline-flex h-6 shrink-0 items-center gap-1 rounded-md px-2 text-[11px] font-medium', config.chip)}>
          {status === 'ready' && <Check aria-hidden="true" className="size-3" strokeWidth={3} />}
          {status === 'generating' ? `${config.label} ${progress}%` : config.label}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {status === 'none' && (
            <button
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#b9e3b6] bg-[#f6fbf5] px-2.5 text-xs font-medium text-[#198c22] hover:bg-[#ecf8eb]"
              onClick={onRead}
              type="button"
            >
              <Mic aria-hidden="true" className="size-3.5" />
              Đọc · {line.chars} ký tự
            </button>
          )}
          {busy && (
            <span className="inline-flex h-8 items-center gap-1.5 px-2 text-xs text-[#6b7280]">
              <LoaderCircle aria-hidden="true" className={cn('size-3.5 text-[#39b536]', status === 'generating' && 'animate-spin')} />
              {status === 'queued' ? 'Chờ…' : 'Đang đọc…'}
            </span>
          )}
          <IconAction
            disabled={status !== 'ready'}
            label={`Tải giọng câu cú máy ${line.shot.number} (.wav)`}
            onClick={() => downloadPlaceholderWav(`cu-may-${line.shot.number}-${line.kind === 'narration' ? 'loi-dan' : 'thoai'}.wav`, seconds)}
          >
            <Download className="size-3.5" />
          </IconAction>
          <IconAction disabled={status === 'none' || busy} label={status === 'outdated' ? 'Đọc lại câu này (lời hoặc giọng đã đổi)' : 'Tạo lại giọng câu này'} onClick={onRead} tone={status === 'outdated' ? 'warn' : 'default'}>
            <RefreshCw className="size-3.5" />
          </IconAction>
          <IconAction disabled={busy} label="Sửa lời đọc" onClick={() => setEditing(line.text)}>
            <PencilLine className="size-3.5" />
          </IconAction>
        </div>
      </div>

      {editing === null ? (
        <p className="mb-0 ml-5 mt-1 text-[13px] leading-5 text-[#374151]">“{line.text}”</p>
      ) : (
        <div className="ml-5 mt-2">
          <textarea
            aria-label={`Sửa lời đọc của ${line.speaker}`}
            autoFocus
            className="w-full resize-y rounded-md border border-[#e2e8f0] bg-white px-2.5 py-2 text-[13px] leading-5 text-[#1f2937] outline-none focus:border-[#39b536] focus:ring-2 focus:ring-[#39b536]/15"
            onChange={(event) => setEditing(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setEditing(null)
              if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) save()
            }}
            rows={2}
            value={editing}
          />
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <span className="text-[11px] text-[#9ca3af]">Lưu vào bảng phân cảnh · giọng cũ sẽ cần đọc lại · Ctrl + Enter lưu, Esc hủy</span>
            <span className="flex gap-1.5">
              <button className="h-7 rounded-md px-2.5 text-xs text-[#4b5563] hover:bg-[#f3f4f6]" onClick={() => setEditing(null)} type="button">
                Hủy
              </button>
              <button className="h-7 rounded-md bg-[#39b536] px-3 text-xs font-medium text-white hover:bg-[#32a92f]" onClick={save} type="button">
                Lưu
              </button>
            </span>
          </div>
        </div>
      )}
    </li>
  )
}

function IconAction({ label, onClick, disabled = false, tone = 'default', children }: { label: string; onClick: () => void; disabled?: boolean; tone?: 'default' | 'warn'; children: ReactNode }) {
  return (
    <button
      aria-label={label}
      className={cn(
        'grid size-8 place-items-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-[#39b536] disabled:cursor-not-allowed disabled:opacity-35',
        tone === 'warn' ? 'text-[#b45309] hover:bg-[#fffbeb]' : 'text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]',
      )}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  )
}
