import { useRef, useState, type ReactNode } from 'react'
import { ImagePlus, RotateCcw } from 'lucide-react'
import { ScriptDialogShell, scriptInputClass, scriptLabelClass } from '@/features/script/components/ScriptDialogShell'
import { readShotImage, SHOT_IMAGE_ACCEPT, ShotImageError } from '../lib/shot-image'
import { CAMERA_MOVES, SHOT_SIZES, type CameraMove, type Shot, type ShotPatch, type ShotSize } from '../lib/storyboard-storage'
import { ShotFrame } from './ShotFrame'

type ShotEditorDialogProps = {
  open: boolean
  shot: Shot | null
  sceneTitle: string
  heading: string
  onClose: () => void
  /** false = không lưu được (dialog giữ nguyên để người dùng thử lại). */
  onSave: (patch: ShotPatch) => boolean
}

const MAX_DURATION = 60
const textareaClass = `${scriptInputClass} h-auto min-h-[76px] resize-y py-2 leading-6`

/** Xem & sửa chi tiết một cú máy: ảnh minh họa, cỡ cảnh, chuyển động, thời lượng, mô tả, nhân vật, thoại, lời dẫn, âm thanh. */
export function ShotEditorDialog({ open, shot, sceneTitle, heading, onClose, onSave }: ShotEditorDialogProps) {
  // Trang cha đặt `key` theo cú máy + lần mở nên state luôn bắt đầu từ dữ liệu mới nhất
  const [draft, setDraft] = useState(() => toDraft(shot))
  const [imageError, setImageError] = useState<string | null>(null)
  const [readingImage, setReadingImage] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!shot) return null

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }))
  const duration = Number(draft.duration)
  const durationValid = Number.isInteger(duration) && duration >= 1 && duration <= MAX_DURATION
  const valid = draft.description.trim().length > 0 && durationValid && !readingImage

  async function pickImage(file: File | undefined) {
    if (!file) return
    setImageError(null)
    setReadingImage(true)
    try {
      set('image', await readShotImage(file))
    } catch (error) {
      setImageError(error instanceof ShotImageError ? error.message : 'Không đọc được ảnh này.')
    } finally {
      setReadingImage(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function save() {
    onSave({
      size: draft.size,
      movement: draft.movement,
      duration,
      description: draft.description.trim(),
      characters: [...new Set(splitNames(draft.characters))],
      character: draft.dialogue.trim() ? draft.character.trim() || 'Nhân vật' : '',
      dialogue: draft.dialogue.trim(),
      narration: draft.narration.trim(),
      sound: draft.sound.trim(),
      transition: draft.transition.trim(),
      image: draft.image ?? '',
    })
  }

  return (
    <ScriptDialogShell
      description={sceneTitle}
      onClose={onClose}
      onSubmit={save}
      open={open}
      size="lg"
      submitDisabled={!valid}
      submitLabel="Lưu cú máy"
      title={`Cú máy ${shot.number}`}
    >
      <div className="grid grid-cols-[minmax(0,240px)_1fr] gap-5 max-[640px]:grid-cols-1">
        {/* Ảnh minh họa */}
        <div>
          <ShotFrame heading={heading} shot={{ ...shot, size: draft.size, characters: splitNames(draft.characters), image: draft.image }} />
          <input accept={SHOT_IMAGE_ACCEPT} className="sr-only" onChange={(event) => void pickImage(event.target.files?.[0])} ref={fileRef} tabIndex={-1} type="file" />
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 text-xs font-medium text-[#374151] hover:bg-[#f9fafb] disabled:opacity-60"
              disabled={readingImage}
              onClick={() => fileRef.current?.click()}
              type="button"
            >
              <ImagePlus aria-hidden="true" className="size-3.5" />
              {readingImage ? 'Đang xử lý ảnh…' : draft.image ? 'Đổi ảnh' : 'Tải ảnh lên'}
            </button>
            {draft.image && (
              <button
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]"
                onClick={() => set('image', undefined)}
                type="button"
              >
                <RotateCcw aria-hidden="true" className="size-3.5" />
                Bỏ ảnh tải lên
              </button>
            )}
          </div>
          <p className={`mb-0 mt-1.5 text-[11px] leading-4 ${imageError ? 'text-[#dc2626]' : 'text-[#9ca3af]'}`} role={imageError ? 'alert' : undefined}>
            {imageError ?? 'PNG, JPG, WEBP · tối đa 10 MB. Ảnh được thu nhỏ để lưu trên trình duyệt.'}
          </p>
        </div>

        {/* Thông số máy quay */}
        <div className="grid grid-cols-2 content-start gap-3.5 max-[420px]:grid-cols-1">
          <Field label="Cỡ cảnh">
            <select className={scriptInputClass} onChange={(event) => set('size', event.target.value as ShotSize)} value={draft.size}>
              {SHOT_SIZES.map((size) => (
                <option key={size}>{size}</option>
              ))}
            </select>
          </Field>
          <Field label="Chuyển động máy">
            <select className={scriptInputClass} onChange={(event) => set('movement', event.target.value as CameraMove)} value={draft.movement}>
              {CAMERA_MOVES.map((move) => (
                <option key={move}>{move}</option>
              ))}
            </select>
          </Field>
          <Field error={durationValid ? undefined : `Từ 1 đến ${MAX_DURATION} giây (số nguyên).`} label="Thời lượng (giây)">
            <input className={scriptInputClass} inputMode="numeric" max={MAX_DURATION} min={1} onChange={(event) => set('duration', event.target.value)} type="number" value={draft.duration} />
          </Field>
          <Field label="Chuyển cảnh sau cú máy">
            <input className={scriptInputClass} onChange={(event) => set('transition', event.target.value)} placeholder="vd. Cắt sang" value={draft.transition} />
          </Field>
          <div className="col-span-full">
            <Field label="Nhân vật trong khung">
              <input className={scriptInputClass} onChange={(event) => set('characters', event.target.value)} placeholder="Cách nhau bằng dấu phẩy, vd. Linh, Bà Hạnh" value={draft.characters} />
            </Field>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3.5">
        <Field error={draft.description.trim() ? undefined : 'Cần mô tả hình ảnh của cú máy.'} label="Mô tả hành động, bối cảnh, hình ảnh">
          <textarea className={textareaClass} onChange={(event) => set('description', event.target.value)} value={draft.description} />
        </Field>
        <div className="grid grid-cols-[180px_1fr] gap-3.5 max-[560px]:grid-cols-1">
          <Field label="Người nói">
            <input className={scriptInputClass} onChange={(event) => set('character', event.target.value)} placeholder="vd. Linh" value={draft.character} />
          </Field>
          <Field label="Lời thoại">
            <input className={scriptInputClass} onChange={(event) => set('dialogue', event.target.value)} placeholder="Để trống nếu cú máy không có thoại" value={draft.dialogue} />
          </Field>
        </div>
        <Field label="Lời dẫn">
          <textarea className={textareaClass} onChange={(event) => set('narration', event.target.value)} placeholder="Lời thuyết minh đọc trên cú máy (nếu có)" value={draft.narration} />
        </Field>
        <Field label="Âm thanh">
          <input className={scriptInputClass} onChange={(event) => set('sound', event.target.value)} placeholder="vd. Tiếng mưa rơi, chuông cửa" value={draft.sound} />
        </Field>
      </div>
    </ScriptDialogShell>
  )
}

type Draft = {
  size: ShotSize
  movement: CameraMove
  duration: string
  description: string
  characters: string
  character: string
  dialogue: string
  narration: string
  sound: string
  transition: string
  image: string | undefined
}

const splitNames = (value: string) => value.split(',').map((name) => name.trim()).filter(Boolean)

function toDraft(shot: Shot | null): Draft {
  return {
    size: shot?.size ?? 'Trung cảnh',
    movement: shot?.movement ?? 'Đứng yên',
    duration: String(shot?.duration ?? 3),
    description: shot?.description ?? '',
    characters: shot?.characters.join(', ') ?? '',
    character: shot?.character ?? '',
    dialogue: shot?.dialogue ?? '',
    narration: shot?.narration ?? '',
    sound: shot?.sound ?? '',
    transition: shot?.transition ?? '',
    image: shot?.image,
  }
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={scriptLabelClass}>{label}</span>
      {children}
      {error && <span className="text-[11px] leading-4 text-[#dc2626]">{error}</span>}
    </label>
  )
}
