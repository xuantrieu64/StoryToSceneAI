import { cn } from '@/lib/utils'

/**
 * Toggle VI/EN theo Figma. Hiện chỉ có nội dung tiếng Việt nên EN bị vô hiệu
 * hóa (kèm tooltip) thay vì đổi ngôn ngữ giả.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const base = 'rounded-sm px-2 py-1 text-xs leading-4 tracking-[0.04em]'

  return (
    <div
      role="group"
      aria-label="Ngôn ngữ giao diện"
      className={cn('flex items-center rounded-lg border border-line bg-surface p-[5px]', className)}
    >
      <button
        type="button"
        aria-pressed="true"
        lang="vi"
        className={cn(base, 'bg-white font-semibold text-ink shadow-[0_1px_1px_rgb(27_23_19/0.06)]')}
      >
        VI
      </button>
      <button
        type="button"
        aria-pressed="false"
        disabled
        lang="en"
        title="Phiên bản tiếng Anh sắp ra mắt"
        className={cn(base, 'cursor-not-allowed font-semibold text-ink-muted')}
      >
        EN
        <span className="sr-only"> (sắp ra mắt)</span>
      </button>
    </div>
  )
}
