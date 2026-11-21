import { useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { Send } from 'lucide-react'

type ChatComposerProps = {
  onSend: (text: string) => void
  /** Nút công cụ ở góc dưới bên trái (vd. menu bộ nhớ AI). */
  tools?: ReactNode
  /** Tùy chọn để trang khác dùng lại (mặc định giữ nguyên Trợ lý kịch bản). */
  inputId?: string
  label?: string
  placeholder?: string
  /** Đang xử lý → vẫn gõ được nhưng chưa gửi được. */
  disabled?: boolean
}

/** Ô soạn tin: viền xanh, nút công cụ (trái), nút gửi tròn (phải). Enter gửi, Shift+Enter xuống dòng. */
export function ChatComposer({
  onSend,
  tools,
  inputId = 'script-assistant-input',
  label = 'Nhắn cho trợ lý kịch bản',
  placeholder = 'Nhập yêu cầu cho trợ lý…',
  disabled = false,
}: ChatComposerProps) {
  const [value, setValue] = useState('')
  const canSend = !disabled && value.trim().length > 0

  function submit(event?: FormEvent) {
    event?.preventDefault()
    if (!canSend) return
    onSend(value.trim())
    setValue('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form
      className="rounded-2xl border-[1.5px] border-[#39b536] bg-white px-4 pb-3 pt-3.5 transition-shadow focus-within:shadow-[0_0_0_3px_rgba(57,181,54,0.12)]"
      onSubmit={submit}
    >
      <label className="sr-only" htmlFor={inputId}>
        {label}
      </label>
      <textarea
        className="block h-[60px] w-full resize-none border-0 bg-transparent p-0 text-[15px] leading-6 text-[#111827] outline-none placeholder:text-[#9ca3af]"
        id={inputId}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        value={value}
      />
      <div className="mt-2 flex items-center justify-between">
        <div>{tools}</div>
        <button
          aria-label="Gửi"
          className="grid size-9 place-items-center rounded-full bg-[#39b536] text-white shadow-sm transition-colors hover:bg-[#32a92f] disabled:cursor-not-allowed disabled:bg-[#a7dca5]"
          disabled={!canSend}
          type="submit"
        >
          <Send aria-hidden="true" className="-ml-px mt-px size-4" fill="currentColor" strokeWidth={1.8} />
        </button>
      </div>
    </form>
  )
}
