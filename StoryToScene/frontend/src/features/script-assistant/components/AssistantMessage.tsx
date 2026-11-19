import { ArrowRight } from 'lucide-react'

import { cn } from '@/lib/utils'

type AssistantMessageProps = {
  text: string
  /** Hiện nút "Bắt đầu" dưới lời chào. */
  onStart?: () => void
  /** Đang kết nối lại → chấm trạng thái chuyển vàng và nhấp nháy. */
  connecting?: boolean
}

/** Bong bóng tin nhắn của trợ lý: chấm trạng thái kết nối + nội dung (+ nút hành động). */
export function AssistantMessage({ text, onStart, connecting = false }: AssistantMessageProps) {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white px-5 pb-5 pt-4 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
      <div className="flex gap-2.5">
        <span
          aria-label={connecting ? 'Đang kết nối' : 'Đã kết nối'}
          className={cn('mt-[9px] size-2 shrink-0 rounded-full', connecting ? 'animate-pulse bg-[#f59e0b]' : 'bg-[#22c55e]')}
          role="status"
        />
        <p className="m-0 text-[15px] leading-[26px] text-[#1f2937]">{text}</p>
      </div>
      {onStart && (
        <button
          className="mt-3.5 inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#f3f4f6] px-4 text-[13px] font-medium text-[#1f2937] transition-colors hover:bg-[#e5e7eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]"
          onClick={onStart}
          type="button"
        >
          Bắt đầu
          <ArrowRight aria-hidden="true" className="size-3.5" />
        </button>
      )}
    </div>
  )
}
