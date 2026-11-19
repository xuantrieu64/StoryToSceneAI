import type { FormEvent, ReactNode } from 'react'
import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'

type ScriptDialogShellProps = {
  open: boolean
  title: string
  description?: string
  submitLabel: string
  submitDisabled?: boolean
  /** md: 600px (mặc định) · lg: 760px cho hộp thoại có vùng soạn nội dung lớn. */
  size?: 'md' | 'lg'
  onClose: () => void
  onSubmit: () => void
  children: ReactNode
}

const POPUP_WIDTH = { md: 'w-[min(calc(100vw-24px),600px)]', lg: 'w-[min(calc(100vw-24px),760px)]' }

/** Khung hộp thoại dùng chung cho Kịch bản (cùng kiểu với "Chỉnh sửa chương" ở trang Truyện). */
export function ScriptDialogShell({ open, title, description, submitLabel, submitDisabled = false, size = 'md', onClose, onSubmit, children }: ScriptDialogShellProps) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!submitDisabled) onSubmit()
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-slate-900/30" />
        <Dialog.Popup
          className={`fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-24px)] ${POPUP_WIDTH[size]} -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white font-sans shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] outline-none max-[560px]:h-dvh max-[560px]:max-h-dvh max-[560px]:w-full max-[560px]:rounded-none`}
        >
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#f1f5f9] px-7 py-5 max-[560px]:px-4">
              <div>
                <Dialog.Title className="m-0 text-xl font-bold leading-7 tracking-[-0.3px] text-[#111827]">{title}</Dialog.Title>
                {description && <Dialog.Description className="mb-0 mt-0.5 text-xs leading-5 text-[#6b7280]">{description}</Dialog.Description>}
              </div>
              <Dialog.Close
                aria-label="Đóng"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-[#9ca3af] hover:bg-gray-50 hover:text-[#4b5563] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]"
              >
                <X aria-hidden="true" className="size-5" />
              </Dialog.Close>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-7 py-5 max-[560px]:px-4">{children}</div>

            <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-[#f1f5f9] bg-[#f9fafb] px-7 py-4 max-[560px]:px-4">
              <button
                className="min-h-10 rounded-lg border border-[#d1d5db] bg-white px-5 text-sm font-semibold text-[#374151] hover:bg-gray-50"
                onClick={onClose}
                type="button"
              >
                Hủy
              </button>
              <button
                className="min-h-10 rounded-lg bg-[#39b536] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#32a92f] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={submitDisabled}
                type="submit"
              >
                {submitLabel}
              </button>
            </footer>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export const scriptInputClass =
  'h-10 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm text-[#1f2937] outline-none placeholder:text-[#9ca3af] focus:border-[#39b536] focus:ring-2 focus:ring-[#39b536]/15'

export const scriptLabelClass = 'text-xs font-bold text-[#334155]'
