import { AlertDialog } from '@base-ui/react/alert-dialog'

type ConfirmDeleteDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}

/** Hộp xác nhận trước khi xóa (cùng kiểu với hộp xóa dự án ở Dashboard). */
export function ConfirmDeleteDialog({ open, title, description, confirmLabel, onCancel, onConfirm }: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-slate-900/30" />
        <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 font-sans shadow-2xl outline-none">
          <AlertDialog.Title className="m-0 text-base font-bold leading-6 text-[#111827]">{title}</AlertDialog.Title>
          <AlertDialog.Description className="mb-0 mt-1.5 text-[13px] leading-5 text-[#6b7280]">{description}</AlertDialog.Description>
          <div className="mt-5 flex justify-end gap-2.5">
            <AlertDialog.Close className="min-h-9 rounded-lg border border-[#e2e8f0] bg-white px-4 text-xs text-[#334155] hover:bg-slate-50">
              Hủy
            </AlertDialog.Close>
            <button
              className="min-h-9 rounded-lg bg-[#dc2626] px-4 text-xs font-bold text-white hover:bg-[#b91c1c]"
              onClick={onConfirm}
              type="button"
            >
              {confirmLabel}
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
