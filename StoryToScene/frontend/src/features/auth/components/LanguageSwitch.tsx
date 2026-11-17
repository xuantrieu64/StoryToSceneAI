import { cn } from '@/lib/utils'

/**
 * Viên chọn ngôn ngữ "EN / VI" theo thiết kế. Hiện chỉ có tiếng Việt nên EN bị
 * vô hiệu hóa kèm tooltip, không đổi ngôn ngữ giả.
 */
export function LanguageSwitch({ className }: { className?: string }) {
  return (
    <div
      role="group"
      aria-label="Ngôn ngữ giao diện"
      className={cn('flex items-center gap-1 rounded-full border border-[#e1e8dd] bg-[#edf3e9] px-3 py-1 text-xs leading-4', className)}
    >
      <button
        type="button"
        aria-pressed="false"
        disabled
        lang="en"
        title="Phiên bản tiếng Anh sắp ra mắt"
        className="cursor-not-allowed font-medium text-slate-500"
      >
        EN<span className="sr-only"> (sắp ra mắt)</span>
      </button>
      <span aria-hidden="true" className="text-slate-400">
        /
      </span>
      <button type="button" aria-pressed="true" lang="vi" className="font-bold text-slate-900">
        VI
      </button>
    </div>
  )
}
