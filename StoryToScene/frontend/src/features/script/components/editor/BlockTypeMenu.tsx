import { Menu } from '@base-ui/react/menu'
import { Check, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BLOCK_LABELS, BLOCK_TYPES, type BlockType } from '../../lib/script-blocks'

type BlockTypeMenuProps = {
  type: BlockType
  onChangeType: (type: BlockType) => void
  onDelete: () => void
  className?: string
}

/** Nhãn loại dòng (CẢNH / HÀNH ĐỘNG / THOẠI / CHUYỂN CẢNH) – bấm để đổi loại hoặc xóa dòng. */
export function BlockTypeMenu({ type, onChangeType, onDelete, className }: BlockTypeMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={`Loại dòng: ${BLOCK_LABELS[type]}. Bấm để đổi loại hoặc xóa`}
        className={cn(
          'inline-flex h-6 shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-[#f3f4f6] px-2 text-[10.5px] font-semibold uppercase tracking-[0.6px] text-[#6b7280] outline-none transition-colors hover:bg-[#e5e7eb] hover:text-[#374151] focus-visible:ring-2 focus-visible:ring-[#39b536]/40 data-[popup-open]:bg-[#eaf7e9] data-[popup-open]:text-[#39b536]',
          className,
        )}
        title="Đổi loại dòng / xóa dòng"
      >
        {BLOCK_LABELS[type]}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="start" className="z-40" sideOffset={6}>
          <Menu.Popup className="min-w-[184px] origin-[var(--transform-origin)] rounded-xl border border-[#e5e7eb] bg-white p-1.5 font-sans text-[13px] shadow-[0_12px_32px_-8px_rgba(15,23,42,0.18),0_2px_6px_rgba(15,23,42,0.06)] outline-none transition-[opacity,transform] duration-150 data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0">
            <p className="m-0 px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-[0.6px] text-[#9ca3af]">Đổi thành</p>
            {BLOCK_TYPES.map((option) => (
              <Menu.Item
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-[#374151] outline-none data-[highlighted]:bg-[#f3f4f6]"
                key={option}
                onClick={() => option !== type && onChangeType(option)}
              >
                {BLOCK_LABELS[option]}
                {option === type && <Check aria-hidden="true" className="size-4 text-[#39b536]" />}
              </Menu.Item>
            ))}
            <div className="my-1 h-px bg-[#f1f5f9]" role="separator" />
            <Menu.Item
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-[#dc2626] outline-none data-[highlighted]:bg-[#fef2f2]"
              onClick={onDelete}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Xóa dòng
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
