import { useId, useRef, useState, type DragEvent } from 'react'
import { CloudUpload, FileText, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { ACCEPTED_STORY_FILES, readStoryFile, StoryFileError } from '@/features/story/lib/read-story-file'
import { cn } from '@/lib/utils'
import { createScript, SCRIPT_CONTENT_LIMIT, SCRIPT_TITLE_LIMIT, type Script } from '../lib/script-storage'
import { ScriptDialogShell, scriptInputClass } from './ScriptDialogShell'

type NewScriptDialogProps = {
  open: boolean
  /** Số tập gán cho kịch bản mới (lớn nhất + 1). */
  episode: number
  onClose: () => void
  /** Trả về false nếu lưu thất bại (giữ hộp thoại mở). */
  onCreate: (script: Script) => boolean
}

const formatCount = (value: number) => value.toLocaleString('vi-VN')

/**
 * Hộp thoại "Thêm kịch bản mới": tên, tải tệp (.txt/.docx ≤ 10MB, kéo thả hoặc nhấp),
 * nội dung (≤ 5.000 ký tự, đếm theo thời gian thực), Hủy / Xác nhận.
 * Trang cha đổi `key` mỗi lần mở → form luôn trống.
 */
export function NewScriptDialog({ open, episode, onClose, onCreate }: NewScriptDialogProps) {
  const ids = { title: useId(), content: useId(), file: useId(), titleError: useId(), contentError: useId() }
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [reading, setReading] = useState(false)
  const [dragging, setDragging] = useState(false)
  /** Chỉ hiện lỗi sau lần bấm Xác nhận đầu tiên (không báo đỏ khi vừa mở). */
  const [submitted, setSubmitted] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const titleInput = useRef<HTMLInputElement>(null)
  const contentInput = useRef<HTMLTextAreaElement>(null)

  const length = content.length
  const overLimit = length > SCRIPT_CONTENT_LIMIT
  const titleError = title.trim() ? null : 'Vui lòng nhập tên kịch bản.'
  const contentError = !content.trim()
    ? 'Vui lòng tải lên tệp hoặc nhập nội dung kịch bản.'
    : overLimit
      ? `Nội dung dài ${formatCount(length)} ký tự, vượt giới hạn ${formatCount(SCRIPT_CONTENT_LIMIT)} ký tự.`
      : null
  const showTitleError = submitted && titleError !== null
  const showContentError = (submitted || overLimit) && contentError !== null

  async function loadFile(file: File | undefined) {
    if (!file || reading) return
    setReading(true)
    try {
      const text = (await readStoryFile(file)).replace(/\r\n?/g, '\n').trim()
      if (!text) throw new StoryFileError('Tệp không có nội dung văn bản.')
      setContent(text)
      setFileName(file.name)
      // Chưa có tên → gợi ý theo tên tệp
      if (!title.trim()) setTitle(file.name.replace(/\.(txt|docx)$/i, '').slice(0, SCRIPT_TITLE_LIMIT))
      if (text.length > SCRIPT_CONTENT_LIMIT) {
        toast.warning(`Đã đọc “${file.name}” nhưng nội dung vượt ${formatCount(SCRIPT_CONTENT_LIMIT)} ký tự`, {
          description: 'Hãy rút gọn nội dung hoặc bấm “Cắt bớt” trước khi xác nhận.',
        })
      } else {
        toast.success(`Đã đọc tệp “${file.name}”`)
      }
    } catch (error) {
      toast.error(error instanceof StoryFileError ? error.message : 'Không đọc được tệp.')
    } finally {
      setReading(false)
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragging(false)
    void loadFile(event.dataTransfer.files[0])
  }

  function submit() {
    setSubmitted(true)
    if (titleError) return titleInput.current?.focus()
    if (contentError) return contentInput.current?.focus()
    onCreate(createScript({ episode, title: title.trim(), content: content.trim() }))
  }

  return (
    <ScriptDialogShell onClose={onClose} onSubmit={submit} open={open} size="lg" submitDisabled={reading} submitLabel="Xác nhận" title="Thêm kịch bản mới">
      <div className="flex flex-col gap-5">
        {/* Tên kịch bản */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold leading-5 text-[#111827]" htmlFor={ids.title}>
            Tên kịch bản <span className="text-[#dc2626]">*</span>
          </label>
          <input
            aria-describedby={showTitleError ? ids.titleError : undefined}
            aria-invalid={showTitleError || undefined}
            autoFocus
            className={cn(scriptInputClass, showTitleError && 'border-[#dc2626] focus:border-[#dc2626] focus:ring-[#dc2626]/15')}
            id={ids.title}
            maxLength={SCRIPT_TITLE_LIMIT}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Vui lòng nhập tên kịch bản"
            ref={titleInput}
            value={title}
          />
          {showTitleError && (
            <p className="m-0 text-xs text-[#dc2626]" id={ids.titleError} role="alert">
              {titleError}
            </p>
          )}
        </div>

        {/* Tải lên tệp – cả vùng là nhãn của input file: nhấp, Enter/Space hoặc kéo thả đều được */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-bold leading-5 text-[#111827]" id={`${ids.file}-label`}>
            Tải lên tệp
          </span>
          <label
            aria-labelledby={`${ids.file}-label`}
            className={cn(
              'flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-7 text-center transition-colors focus-within:ring-2 focus-within:ring-[#39b536]/30 max-[560px]:py-5',
              dragging ? 'border-[#39b536] bg-[#eaf7e9]' : 'border-[#b9e3b6] bg-[#f3faf2] hover:border-[#39b536]',
              reading && 'cursor-wait',
            )}
            htmlFor={ids.file}
            onDragLeave={() => setDragging(false)}
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDrop={handleDrop}
          >
            <span className="grid size-12 place-items-center rounded-full bg-[#eaf7e9] text-[#39b536]">
              {reading ? <Loader2 aria-hidden="true" className="size-6 animate-spin" /> : <CloudUpload aria-hidden="true" className="size-6" />}
            </span>
            <span className="mt-3 text-[15px] font-semibold leading-6 text-[#111827]">
              {reading ? (
                'Đang đọc tệp…'
              ) : (
                <>
                  Kéo thả tệp kịch bản vào đây hoặc <span className="text-[#39b536] underline underline-offset-2">nhấp để tải lên</span>
                </>
              )}
            </span>
            <span className="mt-1 text-xs leading-5 text-[#9ca3af]">Hỗ trợ định dạng .txt, .docx, dung lượng tối đa 10MB</span>
            <input
              accept={ACCEPTED_STORY_FILES}
              className="sr-only"
              disabled={reading}
              id={ids.file}
              onChange={(event) => void loadFile(event.target.files?.[0])}
              ref={fileInput}
              type="file"
            />
          </label>
          {fileName && (
            <div className="flex min-w-0 items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-[13px] text-[#374151]">
              <FileText aria-hidden="true" className="size-4 shrink-0 text-[#39b536]" />
              <span className="min-w-0 flex-1 truncate" title={fileName}>
                {fileName}
              </span>
              <button
                aria-label="Bỏ tệp đã tải"
                className="grid size-6 shrink-0 place-items-center rounded-md text-[#9ca3af] hover:bg-gray-50 hover:text-[#4b5563]"
                onClick={() => {
                  setFileName(null)
                  setContent('')
                }}
                title="Bỏ tệp và xóa nội dung đã đọc"
                type="button"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
          )}
        </div>

        {/* Nội dung kịch bản + bộ đếm */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold leading-5 text-[#111827]" htmlFor={ids.content}>
            Nội dung kịch bản <span className="text-[#dc2626]">*</span>
          </label>
          <textarea
            aria-describedby={`${ids.content}-count${showContentError ? ` ${ids.contentError}` : ''}`}
            aria-invalid={showContentError || undefined}
            className={cn(
              'h-[240px] w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-sm leading-6 text-[#1f2937] outline-none placeholder:text-[#9ca3af] focus:ring-2 max-[560px]:h-[200px]',
              showContentError ? 'border-[#dc2626] focus:border-[#dc2626] focus:ring-[#dc2626]/15' : 'border-[#e2e8f0] focus:border-[#39b536] focus:ring-[#39b536]/15',
            )}
            id={ids.content}
            // Gõ tay dừng ở giới hạn; nội dung đọc từ tệp có thể dài hơn → báo lỗi + nút cắt bớt
            maxLength={overLimit ? undefined : SCRIPT_CONTENT_LIMIT}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Vui lòng tải lên hoặc nhập nội dung kịch bản..."
            ref={contentInput}
            value={content}
          />
          <div className="flex items-start justify-between gap-4">
            {showContentError ? (
              <p className="m-0 flex flex-wrap items-center gap-x-2 text-xs leading-5 text-[#dc2626]" id={ids.contentError} role="alert">
                {contentError}
                {overLimit && (
                  <button
                    className="font-semibold text-[#39b536] underline underline-offset-2 hover:text-[#2f9a2d]"
                    onClick={() => setContent(content.slice(0, SCRIPT_CONTENT_LIMIT))}
                    type="button"
                  >
                    Cắt bớt còn {formatCount(SCRIPT_CONTENT_LIMIT)} ký tự
                  </button>
                )}
              </p>
            ) : (
              <span />
            )}
            <span
              className={cn('shrink-0 text-xs tabular-nums leading-5', overLimit ? 'font-semibold text-[#dc2626]' : length > 0 ? 'text-[#4b5563]' : 'text-[#9ca3af]')}
              id={`${ids.content}-count`}
            >
              {formatCount(length)}/{formatCount(SCRIPT_CONTENT_LIMIT)}
            </span>
          </div>
        </div>
      </div>
    </ScriptDialogShell>
  )
}
