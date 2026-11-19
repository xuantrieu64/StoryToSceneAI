import { Menu } from '@base-ui/react/menu'
import { Loader2, PlugZap, SlidersVertical, Trash, Trash2, X, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MemoryAction = 'reconnect' | 'clearMessages' | 'clearSummary' | 'clearAll'

type MemoryMenuProps = {
  /** Đang kết nối lại – khóa mục "Kết nối lại" và hiện vòng xoay. */
  connecting: boolean
  onAction: (action: MemoryAction) => void
}

const items: { action: MemoryAction; label: string; icon: LucideIcon; danger?: boolean }[] = [
  { action: 'reconnect', label: 'Kết nối lại', icon: PlugZap },
  { action: 'clearMessages', label: 'Xóa bộ nhớ tin nhắn', icon: Trash2 },
  { action: 'clearSummary', label: 'Xóa bộ nhớ tóm tắt', icon: X },
  { action: 'clearAll', label: 'Xóa toàn bộ bộ nhớ', icon: Trash, danger: true },
]

/** Nút thanh trượt trong ô soạn tin + menu tùy chỉnh bộ nhớ AI (mở phía trên nút, nền navy). */
export function MemoryMenu({ connecting, onAction }: MemoryMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label="Tùy chỉnh bộ nhớ AI"
        className="grid size-8 place-items-center rounded-md border border-transparent text-[#6b7280] outline-none transition-colors hover:bg-[#f3f4f6] hover:text-[#374151] focus-visible:border-[#39b536] data-[popup-open]:border-[#39b536] data-[popup-open]:bg-[#ecf8eb] data-[popup-open]:text-[#39b536]"
        title="Tùy chỉnh bộ nhớ AI"
      >
        <SlidersVertical aria-hidden="true" className="size-[18px]" strokeWidth={1.6} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="start" className="z-40" side="top" sideOffset={10}>
          <Menu.Popup className="min-w-[264px] origin-[var(--transform-origin)] rounded-xl border border-[#e5e7eb] bg-white p-2 font-sans text-[15px] shadow-[0_12px_32px_-8px_rgba(15,23,42,0.18),0_2px_6px_rgba(15,23,42,0.06)] outline-none transition-[opacity,transform] duration-150 ease-out data-[ending-style]:translate-y-1 data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[starting-style]:translate-y-1 data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0">
            {items.map(({ action, label, icon: Icon, danger }) => {
              const busy = action === 'reconnect' && connecting
              return (
                <Menu.Item
                  className={cn(
                    'flex cursor-pointer select-none items-center gap-3 rounded-lg px-3 py-2.5 leading-6 outline-none transition-colors data-[disabled]:cursor-wait data-[disabled]:opacity-60',
                    danger
                      ? 'text-[#dc2626] data-[highlighted]:bg-[#fef2f2]'
                      : 'text-[#374151] data-[highlighted]:bg-[#f3f4f6] [&>svg]:text-[#6b7280]',
                  )}
                  disabled={busy}
                  key={action}
                  onClick={() => onAction(action)}
                >
                  {busy ? (
                    <Loader2 aria-hidden="true" className="size-[18px] shrink-0 animate-spin" strokeWidth={1.7} />
                  ) : (
                    <Icon aria-hidden="true" className="size-[18px] shrink-0" strokeWidth={1.7} />
                  )}
                  {busy ? 'Đang kết nối…' : label}
                </Menu.Item>
              )
            })}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
