import { useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { CHARACTER_DESCRIPTION_LIMIT, CHARACTER_NAME_LIMIT } from '@/features/characters/lib/character-storage'
import { ScriptDialogShell, scriptInputClass, scriptLabelClass } from '@/features/script/components/ScriptDialogShell'
import { cn } from '@/lib/utils'
import { readShotImage, SHOT_IMAGE_ACCEPT, ShotImageError } from '../lib/shot-image'

export type CharacterEditorValues = { name: string; description: string; /** Ảnh mẫu tải lên mới (nếu có). */ photo: string | null }

type CharacterEditorDialogProps = {
  open: boolean
  mode: 'create' | 'edit'
  initial: { name: string; description: string }
  /** Lỗi tên (trống / trùng) hoặc null. */
  validateName: (name: string) => string | null
  onClose: () => void
  /** false = không lưu được (giữ hộp thoại). */
  onSubmit: (values: CharacterEditorValues) => boolean
}

/** Thêm / sửa nhân vật ngay ở Khung hình: tên · mô tả ngoại hình (≤ 500 ký tự) · ảnh mẫu tải lên (không bắt buộc). */
export function CharacterEditorDialog({ open, mode, initial, validateName, onClose, onSubmit }: CharacterEditorDialogProps) {
  const [name, setName] = useState(initial.name)
  const [description, setDescription] = useState(initial.description)
  const [photo, setPhoto] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const nameError = validateName(name)
  const descriptionError = description.trim() ? null : 'Mô tả ngoại hình giúp ảnh mẫu và khung hình đúng nhân vật – hãy nhập vài nét chính.'
  // Trùng tên báo ngay khi gõ; bỏ trống chỉ báo sau khi bấm Lưu
  const showNameError = nameError !== null && (submitted || Boolean(name.trim()))

  async function pickPhoto(file: File | undefined) {
    if (!file) return
    setPhotoError(null)
    setReading(true)
    try {
      setPhoto(await readShotImage(file))
    } catch (error) {
      setPhotoError(error instanceof ShotImageError ? error.message : 'Không đọc được ảnh này.')
    } finally {
      setReading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function submit() {
    setSubmitted(true)
    if (nameError || descriptionError || reading) return
    onSubmit({ name: name.trim().replace(/\s+/g, ' '), description: description.trim(), photo })
  }

  return (
    <ScriptDialogShell
      description={mode === 'create' ? 'Nhân vật dùng chung cho mọi tập của dự án.' : 'Đổi tên sẽ cập nhật cả các cú máy đang dùng nhân vật này.'}
      onClose={onClose}
      onSubmit={submit}
      open={open}
      submitDisabled={reading}
      submitLabel="Lưu"
      title={mode === 'create' ? 'Thêm nhân vật' : 'Sửa thông tin nhân vật'}
    >
      <div className="space-y-4">
        <label className="flex flex-col gap-1.5">
          <span className={scriptLabelClass}>Tên nhân vật (đúng như trong cột Thoại)</span>
          <input
            aria-invalid={showNameError || undefined}
            autoFocus
            className={cn(scriptInputClass, showNameError && 'border-[#dc2626] focus:border-[#dc2626]')}
            maxLength={CHARACTER_NAME_LIMIT}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ví dụ: Mai"
            value={name}
          />
          {showNameError && (
            <span className="text-xs text-[#dc2626]" role="alert">
              {nameError}
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={scriptLabelClass}>Mô tả ngoại hình</span>
          <textarea
            aria-invalid={(submitted && descriptionError !== null) || undefined}
            className={cn(scriptInputClass, 'h-auto min-h-[120px] resize-y py-2.5 leading-6', submitted && descriptionError && 'border-[#dc2626] focus:border-[#dc2626]')}
            maxLength={CHARACTER_DESCRIPTION_LIMIT}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ví dụ: Cô gái 19 tuổi, dáng nhỏ nhắn, gương mặt tròn hiền, mắt to, tóc nâu dài buộc đuôi ngựa, hay mặc áo len màu kem và váy xếp ly."
            value={description}
          />
          <span className="flex items-start justify-between gap-4 text-xs">
            <span className={submitted && descriptionError ? 'text-[#dc2626]' : 'text-[#9ca3af]'}>
              {submitted && descriptionError ? descriptionError : 'Tuổi, dáng người, khuôn mặt, tóc, trang phục… càng cụ thể ảnh càng đúng.'}
            </span>
            <span className="shrink-0 tabular-nums text-[#9ca3af]">
              {description.length}/{CHARACTER_DESCRIPTION_LIMIT} ký tự
            </span>
          </span>
        </label>

        <div className="flex flex-col gap-1.5">
          <span className={scriptLabelClass}>Ảnh mẫu (không bắt buộc)</span>
          <div className="flex items-center gap-3">
            {photo ? (
              <span className="relative">
                <img alt="Ảnh mẫu đã chọn" className="h-20 w-16 rounded-lg object-cover ring-1 ring-[#e5e7eb]" src={photo} />
                <button
                  aria-label="Bỏ ảnh đã chọn"
                  className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-white text-[#6b7280] shadow ring-1 ring-[#e5e7eb] hover:text-[#dc2626]"
                  onClick={() => setPhoto(null)}
                  type="button"
                >
                  <X aria-hidden="true" className="size-3" />
                </button>
              </span>
            ) : null}
            <input accept={SHOT_IMAGE_ACCEPT} className="sr-only" onChange={(event) => void pickPhoto(event.target.files?.[0])} ref={fileRef} tabIndex={-1} type="file" />
            <button
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-3 text-[13px] font-medium text-[#374151] hover:bg-[#f9fafb] disabled:opacity-60"
              disabled={reading}
              onClick={() => fileRef.current?.click()}
              type="button"
            >
              <ImagePlus aria-hidden="true" className="size-4" />
              {reading ? 'Đang xử lý ảnh…' : photo ? 'Đổi ảnh' : 'Tải ảnh lên'}
            </button>
          </div>
          <span className={cn('text-xs', photoError ? 'text-[#dc2626]' : 'text-[#9ca3af]')} role={photoError ? 'alert' : undefined}>
            {photoError ?? 'PNG, JPG, WEBP · tối đa 10 MB. Ảnh tải lên được dùng làm ảnh tham chiếu ngay, không tốn lượt.'}
          </span>
        </div>
      </div>
    </ScriptDialogShell>
  )
}
