import { cn } from '@/lib/utils'

/**
 * Chuyển ngôn ngữ VN / EN theo Figma. Hiện chỉ có nội dung tiếng Việt nên EN
 * bị vô hiệu hóa (kèm tooltip) thay vì đổi ngôn ngữ giả.
 */
export function LanguageToggle({ className }: { className?: string }) {
  return (
    <div role="group" aria-label="Ngôn ngữ giao diện" className={cn('flex items-center gap-1 text-xs leading-4 font-semibold', className)}>
      <button type="button" aria-pressed="true" lang="vi" className="rounded px-1 text-jade-600">
        VN
      </button>
      <span aria-hidden="true" className="text-slate-300">
        /
      </span>
      <button
        type="button"
        aria-pressed="false"
        disabled
        lang="en"
        title="Phiên bản tiếng Anh sắp ra mắt"
        className="cursor-not-allowed rounded px-1 text-slate-400"
      >
        EN
        <span className="sr-only"> (sắp ra mắt)</span>
      </button>
    </div>
  )
}
