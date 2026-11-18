import { useDeferredValue, useMemo, useRef, useState, type DragEvent, type ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { ChevronRight, CloudUpload, TriangleAlert, X } from 'lucide-react'
import { toast } from 'sonner'
import { parseChapters, type ParsedChapter } from '../lib/chapter-parser'
import { ACCEPTED_STORY_FILES, readStoryFile, StoryFileError } from '../lib/read-story-file'
import { DEFAULT_VOLUME } from '../lib/story-storage'

type ImportStoryDialogProps = {
  open: boolean
  /** Bản gốc đã lưu trước đó – khôi phục khi mở lại modal. */
  savedSource: string
  /** Nội dung vừa đọc từ tệp (nút "Tải file" ngoài màn hình) – điền sẵn nhưng CHƯA lưu. */
  initialText?: string
  /** Số chương hiện có của dự án (để cảnh báo nhập lại sẽ thay thế). */
  existingChapterCount: number
  onClose: () => void
  /** Bước 1 "Lưu & Tiếp tục": lưu bản gốc. Trả về false nếu lưu thất bại. */
  onSaveSource: (source: string) => boolean
  /** Bước 2 "Lưu": lưu các chương đã chọn. Trả về false nếu lưu thất bại. */
  onConfirm: (source: string, chapters: ParsedChapter[]) => boolean
}

/** Giới hạn tổng số chữ của các chương được chọn trong một lần nhập. */
export const MAX_IMPORT_WORDS = 200_000

/**
 * Modal "Tải lên bản gốc tiểu thuyết".
 * Nội dung chỉ được mount khi mở → đóng mà chưa lưu thì thay đổi bị bỏ,
 * mở lại sẽ bắt đầu từ bản gốc đã lưu.
 */
export function ImportStoryDialog(props: ImportStoryDialogProps) {
  return (
    <Dialog.Root open={props.open} onOpenChange={(next) => !next && props.onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-slate-900/30" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-24px)] w-[min(calc(100vw-24px),746px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white font-sans shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] outline-none max-[560px]:h-dvh max-[560px]:max-h-dvh max-[560px]:w-full max-[560px]:rounded-none">
          {props.open && <DialogBody {...props} />}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

function DialogBody({ savedSource, initialText, existingChapterCount, onClose, onSaveSource, onConfirm }: ImportStoryDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [text, setText] = useState(initialText ?? savedSource)
  /** Nội dung tại lần "Lưu & Tiếp tục" gần nhất trong phiên này (Bước 2 chỉ mở khi khớp). */
  const [savedText, setSavedText] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [reading, setReading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  /** Chương đã chọn ở Bước 2 (theo thứ tự `index`), gắn với bản gốc đã lưu tương ứng. */
  const [selection, setSelection] = useState<{ source: string | null; indexes: Set<number> }>({ source: null, indexes: new Set() })

  const deferredText = useDeferredValue(text)
  const parsed = useMemo(() => parseChapters(deferredText), [deferredText])
  const hasText = text.trim().length > 0
  const canOpenStep2 = savedText !== null && savedText === text

  // Bước 2 dùng đúng bản gốc đã lưu; lưu lại nội dung khác → danh sách & lựa chọn làm mới
  const savedChapters = useMemo(() => (savedText === null ? [] : parseChapters(savedText).chapters), [savedText])
  const selectedIndexes = selection.source === savedText ? selection.indexes : new Set<number>()
  const selectedChapters = savedChapters.filter((chapter) => selectedIndexes.has(chapter.index))
  const selectedWords = selectedChapters.reduce((sum, chapter) => sum + chapter.wordCount, 0)
  const overLimit = selectedWords > MAX_IMPORT_WORDS

  function toggleChapters(indexes: number[], checked: boolean) {
    const next = new Set(selectedIndexes)
    indexes.forEach((index) => (checked ? next.add(index) : next.delete(index)))
    setSelection({ source: savedText, indexes: next })
  }

  async function loadFile(file: File | undefined) {
    if (!file) return
    setReading(true)
    try {
      const content = await readStoryFile(file)
      if (!content.trim()) throw new StoryFileError('Tệp không có nội dung văn bản.')
      setText(content)
      toast.success(`Đã đọc tệp “${file.name}”`, { description: 'Kiểm tra nội dung rồi bấm Lưu & Tiếp tục.' })
    } catch (error) {
      toast.error(error instanceof StoryFileError ? error.message : 'Không đọc được tệp.')
    } finally {
      setReading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    void loadFile(event.dataTransfer.files[0])
  }

  function saveAndContinue() {
    if (!hasText) return
    if (!onSaveSource(text)) {
      toast.error('Không lưu được bản gốc', { description: 'Bộ nhớ trình duyệt có thể đã đầy. Hãy thử nội dung ngắn hơn.' })
      return
    }
    setSavedText(text)
    setStep(2)
  }

  function confirmImport() {
    if (savedText === null || selectedChapters.length === 0 || overLimit) return
    if (!onConfirm(savedText, selectedChapters)) {
      toast.error('Không lưu được các chương', { description: 'Bộ nhớ trình duyệt có thể đã đầy.' })
    }
  }

  return (
    <>
      <header className="flex shrink-0 items-start justify-between gap-4 px-7 pt-6 max-[560px]:px-4 max-[560px]:pt-4">
        <Dialog.Title className="m-0 text-xl font-bold leading-7 tracking-[-0.3px] text-[#111827]">Tải lên bản gốc tiểu thuyết</Dialog.Title>
        <Dialog.Close
          aria-label="Đóng"
          className="grid size-8 shrink-0 place-items-center rounded-lg text-[#9ca3af] hover:bg-gray-50 hover:text-[#4b5563] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]"
        >
          <X aria-hidden="true" className="size-5" />
        </Dialog.Close>
      </header>

      <div aria-label="Các bước nhập truyện" className="flex shrink-0 gap-2 border-b border-[#f1f5f9] px-7 pt-4 max-[560px]:px-4" role="tablist">
        <StepTab active={step === 1} onClick={() => setStep(1)}>
          Bước 1
        </StepTab>
        <StepTab
          active={step === 2}
          disabled={!canOpenStep2}
          onClick={() => setStep(2)}
          title={canOpenStep2 ? undefined : 'Bấm “Lưu & Tiếp tục” để sang Bước 2'}
        >
          Bước 2
        </StepTab>
      </div>

      {step === 1 ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-5 max-[560px]:px-4" role="tabpanel">
          <div
            className={`flex flex-col items-center rounded-2xl border-2 border-dashed px-6 py-6 text-center transition-colors ${
              dragging ? 'border-[#39b536] bg-[#eaf7e9]' : 'border-[#b9e3b6] bg-[#f3faf2]'
            }`}
            onDragLeave={() => setDragging(false)}
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDrop={handleDrop}
          >
            <span className="grid size-12 place-items-center rounded-full bg-[#eaf7e9] text-[#39b536]">
              <CloudUpload aria-hidden="true" className="size-6" />
            </span>
            <p className="mb-0 mt-3 text-[15px] font-semibold leading-6 text-[#111827]">
              {reading ? (
                'Đang đọc tệp…'
              ) : (
                <>
                  Kéo thả tệp văn bản tiểu thuyết vào đây hoặc{' '}
                  <button
                    className="font-semibold text-[#39b536] underline underline-offset-2 hover:text-[#2f9a2d] focus-visible:outline-2 focus-visible:outline-[#39b536]"
                    onClick={() => fileInput.current?.click()}
                    type="button"
                  >
                    nhấp để tải lên
                  </button>
                </>
              )}
            </p>
            <p className="mb-0 mt-1 text-xs leading-5 text-[#9ca3af]">Hỗ trợ định dạng .txt, .docx, dung lượng tệp khuyên dùng dưới 10MB</p>
            <input
              accept={ACCEPTED_STORY_FILES}
              className="hidden"
              onChange={(event) => void loadFile(event.target.files?.[0])}
              ref={fileInput}
              type="file"
            />
          </div>

          <div aria-hidden="true" className="my-4 flex items-center gap-4 text-xs font-medium uppercase tracking-[1px] text-[#9ca3af]">
            <span className="h-px flex-1 bg-[#e5e7eb]" />
            Hoặc
            <span className="h-px flex-1 bg-[#e5e7eb]" />
          </div>

          <label className="block" htmlFor="story-source">
            <span className="text-sm font-bold leading-5 text-[#111827]">Dán trực tiếp nội dung tiểu thuyết</span>
          </label>
          <textarea
            aria-describedby="story-source-hint"
            className="mt-2.5 block h-[180px] w-full resize-y rounded-xl border border-[#39b536] bg-white px-4 py-3 text-sm leading-6 text-[#1f2937] outline-none placeholder:text-[#9ca3af] focus:ring-2 focus:ring-[#39b536]/20 max-[560px]:h-[240px]"
            id="story-source"
            onChange={(event) => setText(event.target.value)}
            placeholder={'Dán nội dung truyện vào đây. Mỗi chương bắt đầu bằng một dòng tiêu đề, ví dụ:\n\nChương 1: Lá thư đầu tiên\nNội dung chương 1…\n\nChương 2: Những điều chưa kịp nói\nNội dung chương 2…'}
            spellCheck={false}
            value={text}
          />
          <div className="mt-2 flex items-center justify-between gap-4 text-xs leading-5 text-[#9ca3af]" id="story-source-hint">
            <span>Hệ thống sẽ tự động nhận diện các phân đoạn và chương truyện theo dòng “Chương N” hoặc “Hồi N”.</span>
            <span aria-live="polite" className={`shrink-0 ${parsed.chapters.length ? 'font-semibold text-[#39b536]' : ''}`}>
              Đã phát hiện: {parsed.chapters.length} chương
            </span>
          </div>
        </div>
      ) : (
        <ChapterSelectTable
          chapters={savedChapters}
          existingChapterCount={existingChapterCount}
          onToggle={toggleChapters}
          overLimit={overLimit}
          selectedIndexes={selectedIndexes}
          selectedWords={selectedWords}
        />
      )}

      <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-[#f1f5f9] bg-[#f9fafb] px-7 py-4 max-[560px]:px-4">
        {step === 1 ? (
          <>
            <button
              className="min-h-10 rounded-lg border border-[#d1d5db] bg-white px-5 text-sm font-semibold text-[#374151] hover:bg-gray-50"
              onClick={onClose}
              type="button"
            >
              Hủy bỏ
            </button>
            <button
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#39b536] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#32a92f] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!hasText || reading}
              onClick={saveAndContinue}
              type="button"
            >
              Lưu &amp; Tiếp tục
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </>
        ) : (
          <>
            <button
              className="min-h-10 rounded-lg border border-[#d1d5db] bg-white px-5 text-sm font-semibold text-[#374151] hover:bg-gray-50"
              onClick={() => setStep(1)}
              type="button"
            >
              Quay lại
            </button>
            <button
              className="min-h-10 rounded-lg bg-[#39b536] px-7 text-sm font-semibold text-white shadow-sm hover:bg-[#32a92f] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={selectedChapters.length === 0 || overLimit}
              onClick={confirmImport}
              title={selectedChapters.length === 0 ? 'Chọn ít nhất một chương' : overLimit ? 'Vượt quá giới hạn chữ' : undefined}
              type="button"
            >
              Lưu
            </button>
          </>
        )}
      </footer>
    </>
  )
}

function StepTab({
  active,
  children,
  disabled = false,
  onClick,
  title,
}: {
  active: boolean
  children: string
  disabled?: boolean
  onClick: () => void
  title?: string
}) {
  return (
    <button
      aria-selected={active}
      className={`relative pb-3 pr-4 text-[15px] font-semibold leading-6 ${
        active ? 'text-[#39b536]' : disabled ? 'cursor-not-allowed text-[#c4c9d1]' : 'text-[#9ca3af] hover:text-[#4b5563]'
      }`}
      disabled={disabled}
      onClick={onClick}
      role="tab"
      title={title}
      type="button"
    >
      {children}
      {active && <span className="absolute bottom-0 left-0 right-4 h-0.5 rounded-full bg-[#39b536]" />}
    </button>
  )
}

type ChapterSelectTableProps = {
  chapters: ParsedChapter[]
  existingChapterCount: number
  selectedIndexes: Set<number>
  selectedWords: number
  overLimit: boolean
  onToggle: (indexes: number[], checked: boolean) => void
}

/** Bước 2: bảng chọn chương (Chương · Tập · Tên chương · Nội dung chương) + tổng số chữ đã chọn. */
function ChapterSelectTable({ chapters, existingChapterCount, selectedIndexes, selectedWords, overLimit, onToggle }: ChapterSelectTableProps) {
  const allIndexes = chapters.map((chapter) => chapter.index)
  const selectedCount = allIndexes.filter((index) => selectedIndexes.has(index)).length
  const allSelected = chapters.length > 0 && selectedCount === chapters.length
  const someSelected = selectedCount > 0 && !allSelected

  return (
    <div className="flex min-h-[420px] flex-1 flex-col overflow-hidden px-7 pt-3 max-[560px]:min-h-0 max-[560px]:px-4" role="tabpanel">
      {existingChapterCount > 0 && (
        <Notice>Dự án đang có {existingChapterCount} chương. Bấm Lưu sẽ thay thế các chương hiện có bằng các chương được chọn.</Notice>
      )}

      <div className="mt-2 min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[620px] border-collapse text-left text-sm leading-5">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b border-[#e5e7eb] text-[#6b7280]">
              <th className="w-12 py-3 pl-3 pr-2 font-normal" scope="col">
                <input
                  aria-label={allSelected ? 'Bỏ chọn tất cả chương' : 'Chọn tất cả chương'}
                  checked={allSelected}
                  className="size-4 cursor-pointer accent-[#39b536] disabled:cursor-not-allowed"
                  disabled={chapters.length === 0}
                  onChange={(event) => onToggle(allIndexes, event.target.checked)}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected
                  }}
                  type="checkbox"
                />
              </th>
              <th className="w-[96px] px-3 py-3 font-medium" scope="col">Chương</th>
              <th className="w-[112px] px-3 py-3 font-medium" scope="col">Tập</th>
              <th className="w-[30%] px-3 py-3 font-medium" scope="col">Tên chương</th>
              <th className="px-3 py-3 font-medium" scope="col">Nội dung chương</th>
            </tr>
          </thead>
          <tbody>
            {chapters.length === 0 ? (
              <tr>
                <td className="px-3 py-12 text-center text-[13px] leading-5 text-[#6b7280]" colSpan={5}>
                  Chưa phát hiện chương nào. Quay lại Bước 1 và thêm dòng tiêu đề như “Chương 1: …” hoặc “Hồi 1: …” ở đầu mỗi chương.
                </td>
              </tr>
            ) : (
              chapters.map((chapter) => {
                const checked = selectedIndexes.has(chapter.index)
                const name = chapter.title || chapter.label
                return (
                  <tr
                    className={`cursor-pointer border-b border-[#f1f5f9] transition-colors ${checked ? 'bg-[#f3faf2]' : 'hover:bg-[#f9fafb]'}`}
                    key={chapter.index}
                    onClick={() => onToggle([chapter.index], !checked)}
                  >
                    <td className="py-3.5 pl-3 pr-2 align-top">
                      <input
                        aria-label={`Chọn ${chapter.label}${chapter.title ? `: ${chapter.title}` : ''}`}
                        checked={checked}
                        className="size-4 cursor-pointer accent-[#39b536]"
                        onChange={(event) => onToggle([chapter.index], event.target.checked)}
                        onClick={(event) => event.stopPropagation()}
                        type="checkbox"
                      />
                    </td>
                    <td className="px-3 py-3.5 align-top font-medium text-[#111827]" title={chapter.label}>
                      {chapter.index}
                    </td>
                    <td className="px-3 py-3.5 align-top font-medium text-[#111827]">{DEFAULT_VOLUME}</td>
                    <td className="px-3 py-3.5 align-top font-medium text-[#111827]">
                      <span className="line-clamp-2 break-words">{name}</span>
                    </td>
                    <td className="px-3 py-3.5 align-top text-[13px] text-[#6b7280]">
                      <span className="line-clamp-2 break-words">{chapter.content || 'Chương chưa có nội dung.'}</span>
                      <span className="mt-0.5 block text-xs text-[#9ca3af]">{chapter.wordCount.toLocaleString('vi-VN')} chữ</span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <p aria-live="polite" className={`mb-0 shrink-0 py-4 text-sm font-medium leading-5 ${overLimit ? 'text-[#dc2626]' : 'text-[#111827]'}`}>
        Đã chọn: {selectedWords.toLocaleString('vi-VN')} chữ ({overLimit ? 'vượt quá' : 'nhỏ hơn'} {MAX_IMPORT_WORDS.toLocaleString('vi-VN')} chữ)
        {selectedCount > 0 && <span className="font-normal text-[#6b7280]"> · {selectedCount}/{chapters.length} chương</span>}
      </p>
    </div>
  )
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="mb-0 mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 first:mt-0">
      <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  )
}
