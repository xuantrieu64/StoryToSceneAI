import { useId, useRef, useState } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CHARACTER_DESCRIPTION_LIMIT, CHARACTER_NAME_LIMIT, KIND_LABELS, type EntityKind } from '../lib/character-storage'

export type CharacterFormValues = { kind: EntityKind; name: string; description: string }

type CharacterFormDialogProps = {
  open: boolean
  mode: 'create' | 'edit'
  initial: CharacterFormValues
  /** Trả về thông báo lỗi tên (vd. trùng) hoặc null nếu hợp lệ. */
  validateName: (kind: EntityKind, name: string) => string | null
  onClose: () => void
  /** Trả về false nếu lưu thất bại (giữ hộp thoại mở). */
  onSubmit: (values: CharacterFormValues) => boolean
}

/** Nhãn & gợi ý theo loại. Địa điểm / Đạo cụ mới giữ cấu trúc form, chưa lưu được. */
const FIELDS: Record<EntityKind, { name: string; namePlaceholder: string; description: string; descriptionPlaceholder: string; enabled: boolean }> = {
  character: {
    name: 'Tên (đúng như trong cột Thoại)',
    namePlaceholder: 'Vd. Linh',
    description: 'Ngoại hình',
    descriptionPlaceholder: 'Ví dụ: Nữ 22 tuổi, dáng gầy, tóc đen dài buộc thấp, áo bà ba trắng, khăn tang trắng.',
    enabled: true,
  },
  location: {
    name: 'Tên (đúng như trong tiêu đề cảnh)',
    namePlaceholder: 'Vd. Tiệm sách cũ',
    description: 'Mô tả bối cảnh',
    descriptionPlaceholder: 'Ví dụ: Tiệm sách nhỏ, kệ gỗ cao chạm trần, đèn vàng, mùi giấy cũ, cửa kính mờ hơi nước.',
    enabled: false,
  },
  prop: {
    name: 'Tên đạo cụ',
    namePlaceholder: 'Vd. Phong bì giấy dó',
    description: 'Mô tả đạo cụ',
    descriptionPlaceholder: 'Ví dụ: Phong bì giấy dó màu ngà, mép sờn, không đề tên người gửi.',
    enabled: false,
  },
}

const inputBase = 'w-full rounded-lg border bg-white px-3 text-sm text-[#1f2937] outline-none placeholder:text-[#9ca3af] focus:ring-2'
const inputState = (error: boolean) => (error ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-[#dc2626]/15' : 'border-[#e2e8f0] focus:border-[#39b536] focus:ring-[#39b536]/15')

/** Hộp thoại "Thêm nhân vật" (3 tab) / "Sửa nhân vật". Trang cha đổi `key` mỗi lần mở để form luôn mới. */
export function CharacterFormDialog({ open, mode, initial, validateName, onClose, onSubmit }: CharacterFormDialogProps) {
  const ids = { name: useId(), description: useId(), nameError: useId(), descriptionError: useId() }
  const [kind, setKind] = useState<EntityKind>(initial.kind)
  const [name, setName] = useState(initial.name)
  const [description, setDescription] = useState(initial.description)
  const [submitted, setSubmitted] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const fields = FIELDS[kind]

  const nameError = !name.trim() ? 'Vui lòng nhập tên.' : validateName(kind, name)
  const descriptionError = !description.trim() ? `Vui lòng nhập ${fields.description.toLocaleLowerCase('vi')}.` : null
  // Trùng tên báo ngay khi gõ; lỗi bỏ trống chỉ báo sau khi bấm Lưu
  const showNameError = nameError !== null && (submitted || Boolean(name.trim()))
  const showDescriptionError = submitted && descriptionError !== null

  function submit() {
    if (!fields.enabled) return
    setSubmitted(true)
    if (nameError) return nameRef.current?.focus()
    if (descriptionError) return descriptionRef.current?.focus()
    onSubmit({ kind, name: name.trim().replace(/\s+/g, ' '), description: description.trim() })
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-slate-900/30" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-24px)] w-[min(calc(100vw-24px),480px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white font-sans shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] outline-none max-[560px]:h-dvh max-[560px]:max-h-dvh max-[560px]:w-full max-[560px]:rounded-none">
          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            <header className="flex shrink-0 items-start justify-between gap-4 px-6 pt-5 max-[560px]:px-4">
              <Dialog.Title className="m-0 text-lg font-bold leading-7 tracking-[-0.3px] text-[#111827]">
                {mode === 'create' ? 'Thêm nhân vật' : `Sửa ${KIND_LABELS[kind].toLocaleLowerCase('vi')}`}
              </Dialog.Title>
              <Dialog.Close
                aria-label="Đóng"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-[#9ca3af] hover:bg-gray-50 hover:text-[#4b5563] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]"
              >
                <X aria-hidden="true" className="size-5" />
              </Dialog.Close>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2 pt-4 max-[560px]:px-4">
              {mode === 'create' && (
                <div aria-label="Loại" className="mb-5 flex flex-wrap gap-2" role="tablist">
                  {(Object.keys(FIELDS) as EntityKind[]).map((option) => (
                    <button
                      aria-selected={kind === option}
                      className={cn(
                        'h-9 rounded-lg border px-4 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]',
                        kind === option ? 'border-[#39b536] bg-[#f3faf2] text-[#2f9a2d]' : 'border-[#e5e7eb] bg-white text-[#374151] hover:bg-gray-50',
                      )}
                      key={option}
                      onClick={() => {
                        setKind(option)
                        setSubmitted(false)
                      }}
                      role="tab"
                      type="button"
                    >
                      {KIND_LABELS[option]}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-medium text-[#374151]" htmlFor={ids.name}>
                  {fields.name}
                </label>
                <input
                  aria-describedby={showNameError ? ids.nameError : undefined}
                  aria-invalid={showNameError || undefined}
                  autoFocus
                  className={cn(inputBase, 'h-11', inputState(showNameError))}
                  id={ids.name}
                  maxLength={CHARACTER_NAME_LIMIT}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={fields.namePlaceholder}
                  ref={nameRef}
                  value={name}
                />
                {showNameError && (
                  <p className="m-0 text-xs text-[#dc2626]" id={ids.nameError} role="alert">
                    {nameError}
                  </p>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <label className="text-[13px] font-medium text-[#374151]" htmlFor={ids.description}>
                  {fields.description}
                </label>
                <textarea
                  aria-describedby={`${ids.description}-count${showDescriptionError ? ` ${ids.descriptionError}` : ''}`}
                  aria-invalid={showDescriptionError || undefined}
                  className={cn(inputBase, 'h-[120px] resize-y py-2.5 leading-6', inputState(showDescriptionError))}
                  id={ids.description}
                  maxLength={CHARACTER_DESCRIPTION_LIMIT}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder={fields.descriptionPlaceholder}
                  ref={descriptionRef}
                  value={description}
                />
                <div className="flex items-start justify-between gap-4">
                  {showDescriptionError ? (
                    <p className="m-0 text-xs text-[#dc2626]" id={ids.descriptionError} role="alert">
                      {descriptionError}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="shrink-0 text-xs tabular-nums text-[#9ca3af]" id={`${ids.description}-count`}>
                    {description.length}/{CHARACTER_DESCRIPTION_LIMIT} ký tự
                  </span>
                </div>
              </div>

              {!fields.enabled && (
                <p className="mb-0 mt-3 rounded-lg bg-[#f9fafb] px-3 py-2 text-xs leading-5 text-[#6b7280]">
                  Lưu {KIND_LABELS[kind].toLocaleLowerCase('vi')} sẽ sớm được hỗ trợ. Hiện bạn có thể thêm Nhân vật.
                </p>
              )}
            </div>

            <footer className="flex shrink-0 items-center justify-end gap-3 px-6 pb-5 pt-4 max-[560px]:px-4">
              <button className="min-h-10 rounded-lg bg-[#f3f4f6] px-5 text-sm font-medium text-[#374151] hover:bg-[#e5e7eb]" onClick={onClose} type="button">
                Hủy
              </button>
              <button
                className="min-h-10 rounded-lg bg-[#39b536] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#32a92f] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!fields.enabled}
                type="submit"
              >
                Lưu
              </button>
            </footer>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
