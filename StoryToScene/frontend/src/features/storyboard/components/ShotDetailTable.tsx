import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { Check, Maximize2, Pencil, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CAMERA_MOVES, SHOT_SIZES, sceneCharacters, sceneTitle, type CameraMove, type Shot, type ShotPatch, type ShotSize } from '../lib/storyboard-storage'
import type { StoryboardViewProps } from './StoryboardViews'

type ShotDetailTableProps = StoryboardViewProps & {
  /** Bấm vào dòng → chọn cú máy (nút "Sửa tay" phía trên sẽ mở đúng cú máy này). */
  onSelectShot: (shotNumber: number) => void
  /** Lưu sửa trên dòng; false = không lưu được (dòng giữ chế độ sửa). */
  onSaveShot: (shotNumber: number, patch: ShotPatch) => boolean
}

type RowDraft = {
  description: string
  duration: string
  size: ShotSize
  movement: CameraMove
  character: string
  dialogue: string
  sound: string
}

const MAX_DURATION = 60

/** Độ rộng cột cố định → nội dung dài tự xuống dòng, bảng không bị vỡ. */
const COLUMNS: { label: string; width: string }[] = [
  { label: 'STT', width: 'w-[52px]' },
  { label: 'Mô tả hình', width: 'w-[26%]' },
  { label: 'Thời lượng', width: 'w-[88px]' },
  { label: 'Cỡ cảnh', width: 'w-[112px]' },
  { label: 'Chuyển động máy', width: 'w-[128px]' },
  { label: 'Thoại', width: 'w-[22%]' },
  { label: 'Âm thanh', width: 'w-[16%]' },
  { label: '', width: 'w-[76px]' },
]

const cellInput =
  'w-full rounded-md border border-[#e2e8f0] bg-white px-2 py-1.5 text-[13px] leading-5 text-[#1f2937] outline-none placeholder:text-[#9ca3af] focus:border-[#39b536] focus:ring-2 focus:ring-[#39b536]/15'

const toDraft = (shot: Shot): RowDraft => ({
  description: shot.description,
  duration: String(shot.duration),
  size: shot.size,
  movement: shot.movement,
  character: shot.character ?? '',
  dialogue: shot.dialogue ?? '',
  sound: shot.sound,
})

/**
 * Chế độ Bảng chi tiết: nhóm theo cảnh (dòng tiêu đề cảnh + nhân vật), mỗi cú máy một dòng.
 * Sửa trực tiếp trên dòng (mô tả, thời lượng, cỡ cảnh, chuyển động, thoại, âm thanh); lưu chung một nguồn dữ liệu
 * với Storyboard và Timeline nên các chế độ xem luôn đồng bộ.
 */
export function ShotDetailTable({ storyboard, selectedShot, highlightedShot, onOpenShot, onSelectShot, onSaveShot }: ShotDetailTableProps) {
  const [editing, setEditing] = useState<{ shot: number; draft: RowDraft } | null>(null)

  const duration = editing ? Number(editing.draft.duration) : 0
  const durationValid = Number.isInteger(duration) && duration >= 1 && duration <= MAX_DURATION
  const descriptionValid = editing ? editing.draft.description.trim().length > 0 : true
  const canSave = editing !== null && durationValid && descriptionValid

  const set = <K extends keyof RowDraft>(key: K, value: RowDraft[K]) =>
    setEditing((current) => (current ? { ...current, draft: { ...current.draft, [key]: value } } : current))

  function startEdit(shot: Shot) {
    onSelectShot(shot.number)
    setEditing({ shot: shot.number, draft: toDraft(shot) })
  }

  function save() {
    if (!editing || !canSave) return
    const { draft } = editing
    const dialogue = draft.dialogue.trim()
    const saved = onSaveShot(editing.shot, {
      description: draft.description.trim(),
      duration,
      size: draft.size,
      movement: draft.movement,
      dialogue,
      character: dialogue ? draft.character.trim() || 'Nhân vật' : '',
      sound: draft.sound.trim(),
    })
    if (saved) setEditing(null)
  }

  /** Esc: hủy · Ctrl/⌘ + Enter: lưu. */
  function handleKeys(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault()
      setEditing(null)
    } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault()
      save()
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#eceef1] bg-white">
      <table className="w-full min-w-[920px] table-fixed border-collapse text-left text-[13px] leading-5">
        <colgroup>
          {COLUMNS.map((column, index) => (
            <col className={column.width} key={index} />
          ))}
        </colgroup>
        <thead className="bg-[#f9fafb] text-xs text-[#6b7280]">
          <tr>
            {COLUMNS.map((column, index) => (
              <th className="border-b border-[#eceef1] px-3 py-2.5 align-bottom font-semibold" key={index} scope="col">
                {column.label || <span className="sr-only">Thao tác</span>}
              </th>
            ))}
          </tr>
        </thead>

        {storyboard.scenes.map((scene) => {
          const characters = sceneCharacters(scene)
          return (
            <tbody className="border-b border-[#e5e7eb] last:border-b-0" key={scene.id}>
              <tr>
                <th className="bg-[#f6faf5] px-3 py-2.5 text-[13px] font-semibold text-[#111827]" colSpan={COLUMNS.length} scope="colgroup">
                  {sceneTitle(scene)}
                  {characters.length > 0 && <span className="font-normal text-[#4b5563]"> · Nhân vật: {characters.join(', ')}</span>}
                  <span className="float-right text-xs font-normal text-[#9ca3af]">{scene.shots.length} cú máy</span>
                </th>
              </tr>

              {scene.shots.map((shot) => {
                const isEditing = editing?.shot === shot.number
                const active = shot.number === selectedShot || shot.number === highlightedShot
                return (
                  <tr
                    className={cn(
                      'border-t border-[#f1f2f4] align-top transition-colors',
                      isEditing ? 'bg-[#fbfdfb]' : active ? 'bg-[#ecf8eb]' : 'cursor-pointer hover:bg-[#f9fafb]',
                    )}
                    key={shot.id}
                    onClick={isEditing ? undefined : () => onSelectShot(shot.number)}
                    onDoubleClick={isEditing ? undefined : () => startEdit(shot)}
                    onKeyDown={isEditing ? handleKeys : undefined}
                  >
                    <td className="px-3 py-3 font-semibold tabular-nums text-[#374151]">{shot.number}</td>

                    {isEditing && editing ? (
                      <EditCells draft={editing.draft} descriptionValid={descriptionValid} durationValid={durationValid} set={set} />
                    ) : (
                      <ReadCells shot={shot} />
                    )}

                    <td className="px-2 py-2.5">
                      <div className="flex justify-end gap-0.5">
                        {isEditing ? (
                          <>
                            <IconButton disabled={!canSave} label={`Lưu cú máy ${shot.number}`} onClick={save} tone="primary">
                              <Check className="size-4" strokeWidth={2.4} />
                            </IconButton>
                            <IconButton label="Hủy sửa" onClick={() => setEditing(null)}>
                              <X className="size-4" />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <IconButton label={`Sửa nhanh cú máy ${shot.number} trên dòng`} onClick={() => startEdit(shot)}>
                              <Pencil className="size-3.5" />
                            </IconButton>
                            <IconButton label={`Mở chi tiết cú máy ${shot.number} (ảnh, nhân vật, lời dẫn…)`} onClick={() => onOpenShot(shot.number)}>
                              <Maximize2 className="size-3.5" />
                            </IconButton>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          )
        })}
      </table>
      <p className="m-0 border-t border-[#eceef1] px-3 py-2 text-[11px] text-[#9ca3af]">
        Bấm đúp hoặc nút bút chì để sửa trên dòng · Ctrl + Enter lưu · Esc hủy
      </p>
    </div>
  )
}

function ReadCells({ shot }: { shot: Shot }) {
  const empty = <span className="text-[#d1d5db]">—</span>
  return (
    <>
      <td className="break-words px-3 py-3 text-[#1f2937]">{shot.description}</td>
      <td className="whitespace-nowrap px-3 py-3 tabular-nums text-[#374151]">{shot.duration} giây</td>
      <td className="px-3 py-3 font-medium text-[#198c22]">{shot.size}</td>
      <td className="px-3 py-3 text-[#374151]">{shot.movement}</td>
      <td className="break-words px-3 py-3 text-[#374151]">
        {shot.dialogue ? (
          <>
            <span className="font-semibold text-[#111827]">{shot.character}:</span> “{shot.dialogue}”
          </>
        ) : shot.narration ? (
          <>
            <span className="font-semibold text-[#111827]">Lời dẫn:</span> {shot.narration}
          </>
        ) : (
          empty
        )}
      </td>
      <td className="break-words px-3 py-3 text-[#6b7280]">{shot.sound || empty}</td>
    </>
  )
}

type EditCellsProps = {
  draft: RowDraft
  durationValid: boolean
  descriptionValid: boolean
  set: <K extends keyof RowDraft>(key: K, value: RowDraft[K]) => void
}

function EditCells({ draft, durationValid, descriptionValid, set }: EditCellsProps) {
  return (
    <>
      <td className="px-2 py-2.5">
        <textarea
          aria-invalid={!descriptionValid}
          aria-label="Mô tả hình"
          autoFocus
          className={cn(cellInput, 'min-h-[84px] resize-y', !descriptionValid && 'border-[#fca5a5]')}
          onChange={(event) => set('description', event.target.value)}
          value={draft.description}
        />
      </td>
      <td className="px-2 py-2.5">
        <input
          aria-invalid={!durationValid}
          aria-label="Thời lượng (giây)"
          className={cn(cellInput, !durationValid && 'border-[#fca5a5]')}
          inputMode="numeric"
          max={MAX_DURATION}
          min={1}
          onChange={(event) => set('duration', event.target.value)}
          type="number"
          value={draft.duration}
        />
        <span className={cn('mt-1 block text-[11px]', durationValid ? 'text-[#9ca3af]' : 'text-[#dc2626]')}>{durationValid ? 'giây' : `1–${MAX_DURATION} giây`}</span>
      </td>
      <td className="px-2 py-2.5">
        <select aria-label="Cỡ cảnh" className={cellInput} onChange={(event) => set('size', event.target.value as ShotSize)} value={draft.size}>
          {SHOT_SIZES.map((size) => (
            <option key={size}>{size}</option>
          ))}
        </select>
      </td>
      <td className="px-2 py-2.5">
        <select aria-label="Chuyển động máy" className={cellInput} onChange={(event) => set('movement', event.target.value as CameraMove)} value={draft.movement}>
          {CAMERA_MOVES.map((move) => (
            <option key={move}>{move}</option>
          ))}
        </select>
      </td>
      <td className="space-y-1.5 px-2 py-2.5">
        <input aria-label="Người nói" className={cellInput} onChange={(event) => set('character', event.target.value)} placeholder="Người nói" value={draft.character} />
        <textarea
          aria-label="Lời thoại"
          className={cn(cellInput, 'min-h-[52px] resize-y')}
          onChange={(event) => set('dialogue', event.target.value)}
          placeholder="Để trống nếu không có thoại"
          value={draft.dialogue}
        />
      </td>
      <td className="px-2 py-2.5">
        <textarea
          aria-label="Âm thanh"
          className={cn(cellInput, 'min-h-[84px] resize-y')}
          onChange={(event) => set('sound', event.target.value)}
          placeholder="vd. Tiếng mưa rơi"
          value={draft.sound}
        />
      </td>
    </>
  )
}

function IconButton({ label, onClick, disabled = false, tone = 'default', children }: { label: string; onClick: () => void; disabled?: boolean; tone?: 'default' | 'primary'; children: ReactNode }) {
  return (
    <button
      aria-label={label}
      className={cn(
        'grid size-7 place-items-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#39b536] disabled:cursor-not-allowed disabled:opacity-40',
        tone === 'primary' ? 'bg-[#39b536] text-white hover:bg-[#32a92f]' : 'text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]',
      )}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      title={label}
      type="button"
    >
      {children}
    </button>
  )
}
