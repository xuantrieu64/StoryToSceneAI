import { useState, type FormEvent } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import { countWords } from '../lib/chapter-parser'
import { chapterVolume, DEFAULT_VOLUME, relabelChapter, type StoryChapter } from '../lib/story-storage'

type EditChapterDialogProps = {
  /** Chương đang sửa; null = đóng. */
  chapter: StoryChapter | null
  /** Các chương khác (để kiểm tra trùng số chương). */
  otherChapters: StoryChapter[]
  onClose: () => void
  /** Trả về false nếu lưu thất bại. */
  onSave: (chapter: StoryChapter) => boolean
}

/** Modal "Chỉnh sửa chương": sửa số chương, tập, tên và nội dung. Giữ nguyên ID chương. */
export function EditChapterDialog({ chapter, otherChapters, onClose, onSave }: EditChapterDialogProps) {
  return (
    <Dialog.Root open={chapter !== null} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-slate-900/30" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-24px)] w-[min(calc(100vw-24px),720px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white font-sans shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] outline-none max-[560px]:h-dvh max-[560px]:max-h-dvh max-[560px]:w-full max-[560px]:rounded-none">
          {/* key: mở chương khác → form nạp lại dữ liệu của chương đó */}
          {chapter && <EditChapterForm chapter={chapter} key={chapter.id} onClose={onClose} onSave={onSave} otherChapters={otherChapters} />}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function EditChapterForm({ chapter, otherChapters, onClose, onSave }: Omit<EditChapterDialogProps, 'chapter'> & { chapter: StoryChapter }) {
  const [number, setNumber] = useState(String(chapter.index))
  const [volume, setVolume] = useState(chapterVolume(chapter))
  const [title, setTitle] = useState(chapter.title)
  const [content, setContent] = useState(chapter.content)

  const parsedNumber = Number(number)
  const numberError = !/^\d+$/.test(number.trim()) || parsedNumber < 1
    ? 'Số chương phải là số nguyên dương.'
    : otherChapters.some((other) => other.index === parsedNumber)
      ? `Đã có chương số ${parsedNumber}.`
      : null

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (numberError) return
    onSave({
      ...chapter,
      id: chapter.id,
      index: parsedNumber,
      label: relabelChapter(chapter.label, parsedNumber),
      volume: volume.trim() || DEFAULT_VOLUME,
      title: title.trim(),
      content: content.trim(),
      wordCount: countWords(content),
    })
  }

  const inputClass =
    'h-10 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm text-[#1f2937] outline-none placeholder:text-[#9ca3af] focus:border-[#39b536] focus:ring-2 focus:ring-[#39b536]/15'

  return (
    <form className="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#f1f5f9] px-7 py-5 max-[560px]:px-4">
        <div>
          <Dialog.Title className="m-0 text-xl font-bold leading-7 tracking-[-0.3px] text-[#111827]">Chỉnh sửa chương</Dialog.Title>
          <Dialog.Description className="mb-0 mt-0.5 text-xs leading-5 text-[#6b7280]">{chapter.label}{chapter.title ? `: ${chapter.title}` : ''}</Dialog.Description>
        </div>
        <Dialog.Close
          aria-label="Đóng"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-[#9ca3af] hover:bg-gray-50 hover:text-[#4b5563] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]"
        >
          <X aria-hidden="true" className="size-5" />
        </Dialog.Close>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[140px_minmax(0,1fr)] content-start gap-x-4 gap-y-4 overflow-y-auto px-7 py-5 max-[560px]:grid-cols-1 max-[560px]:px-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-[#334155]">Số chương</span>
          <input
            aria-describedby={numberError ? 'chapter-number-error' : undefined}
            aria-invalid={numberError ? true : undefined}
            className={`${inputClass} ${numberError ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-[#dc2626]/15' : ''}`}
            inputMode="numeric"
            onChange={(event) => setNumber(event.target.value)}
            required
            value={number}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-[#334155]">Tập</span>
          <input className={inputClass} onChange={(event) => setVolume(event.target.value)} placeholder={DEFAULT_VOLUME} value={volume} />
        </label>
        {numberError && (
          <p className="col-span-full -mt-2 mb-0 text-xs text-[#dc2626]" id="chapter-number-error" role="alert">
            {numberError}
          </p>
        )}
        <label className="col-span-full flex flex-col gap-1.5">
          <span className="text-xs font-bold text-[#334155]">Tên chương</span>
          <input className={inputClass} onChange={(event) => setTitle(event.target.value)} placeholder="Để trống sẽ hiển thị theo số chương" value={title} />
        </label>
        <label className="col-span-full flex flex-col gap-1.5">
          <span className="flex items-baseline justify-between text-xs font-bold text-[#334155]">
            Nội dung chương
            <span className="font-normal text-[#9ca3af]">{countWords(content).toLocaleString('vi-VN')} chữ</span>
          </span>
          <textarea
            className="h-[280px] w-full resize-y rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm leading-6 text-[#1f2937] outline-none focus:border-[#39b536] focus:ring-2 focus:ring-[#39b536]/15 max-[560px]:h-[320px]"
            onChange={(event) => setContent(event.target.value)}
            value={content}
          />
        </label>
      </div>

      <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-[#f1f5f9] bg-[#f9fafb] px-7 py-4 max-[560px]:px-4">
        <button
          className="min-h-10 rounded-lg border border-[#d1d5db] bg-white px-5 text-sm font-semibold text-[#374151] hover:bg-gray-50"
          onClick={onClose}
          type="button"
        >
          Hủy
        </button>
        <button
          className="min-h-10 rounded-lg bg-[#39b536] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#32a92f] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={numberError !== null}
          type="submit"
        >
          Lưu thay đổi
        </button>
      </footer>
    </form>
  )
}
