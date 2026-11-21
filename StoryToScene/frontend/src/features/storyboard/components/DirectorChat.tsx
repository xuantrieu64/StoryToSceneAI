import { useEffect, useRef } from 'react'
import { Clapperboard } from 'lucide-react'
import { ChatComposer } from '@/features/script-assistant/components/ChatComposer'
import { UserMessage } from '@/features/script-assistant/components/UserMessage'
import { cn } from '@/lib/utils'
import type { DirectorMessage } from '../lib/director-session'

type DirectorChatProps = {
  messages: DirectorMessage[]
  /** Nội dung dòng "đang xử lý" (null = không xử lý gì). */
  processingLabel: string | null
  onSend: (text: string) => void
}

/** Cột giữa: header Trợ lý đạo diễn + trạng thái, hội thoại, ô nhập. */
export function DirectorChat({ messages, processingLabel, onSend }: DirectorChatProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const busy = processingLabel !== null

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, busy])

  return (
    <section aria-label="Trò chuyện với Trợ lý đạo diễn" className="flex min-h-0 min-w-0 flex-col">
      <header className="flex h-[60px] shrink-0 items-center gap-2.5 border-b border-[#eceef1] px-5 max-[760px]:px-4">
        <span className="grid size-8 place-items-center rounded-lg bg-[#ecf8eb] text-[#39b536]">
          <Clapperboard aria-hidden="true" className="size-4" strokeWidth={2} />
        </span>
        <h2 className="m-0 text-[15px] font-semibold leading-6 text-[#111827]">Trợ lý đạo diễn</h2>
        <span className="ml-1 inline-flex items-center gap-1.5 text-xs text-[#6b7280]" role="status">
          <span className={cn('size-2 rounded-full', busy ? 'animate-pulse bg-[#f59e0b]' : 'bg-[#22c55e]')} />
          {busy ? 'Đang xử lý' : 'Sẵn sàng'}
        </span>
      </header>

      <div aria-live="polite" className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 max-[760px]:px-4" ref={listRef}>
        {messages.map((message) =>
          message.role === 'user' ? (
            <UserMessage key={message.id} text={message.text} />
          ) : (
            <div
              className={cn(
                'max-w-[92%] whitespace-pre-line rounded-2xl rounded-tl-md border px-4 py-3 text-sm leading-6 shadow-[0_1px_2px_rgba(16,24,40,0.03)]',
                message.tone === 'error' ? 'border-[#fde2e2] bg-[#fff7f7] text-[#991b1b]' : 'border-[#e5e7eb] bg-white text-[#1f2937]',
              )}
              key={message.id}
            >
              {message.text}
            </div>
          ),
        )}
        {busy && (
          <p className="m-0 flex items-center gap-2 text-xs text-[#6b7280]">
            <span aria-hidden="true" className="flex gap-1">
              {[0, 150, 300].map((delay) => (
                <span className="size-1.5 animate-bounce rounded-full bg-[#39b536]" key={delay} style={{ animationDelay: `${delay}ms` }} />
              ))}
            </span>
            {processingLabel}
          </p>
        )}
      </div>

      <div className="shrink-0 px-5 pb-5 max-[760px]:px-4">
        <ChatComposer
          disabled={busy}
          inputId="director-assistant-input"
          label="Nhắn cho Trợ lý đạo diễn"
          onSend={onSend}
          placeholder="Nhắn trợ lý, ví dụ: cú máy 5 đổi sang toàn cảnh…"
        />
      </div>
    </section>
  )
}
