import { useMemo, useState } from 'react'
import { BULK_SCRIPT_LIMIT, parseBulkTitles } from '../lib/script-storage'
import { ScriptDialogShell, scriptLabelClass } from './ScriptDialogShell'

type BulkAddScriptsDialogProps = {
  open: boolean
  /** Số tập bắt đầu đánh cho các kịch bản mới. */
  startEpisode: number
  /** Tên các chương đã nhập ở trang Truyện (để điền nhanh); rỗng = ẩn nút. */
  chapterTitles: string[]
  onClose: () => void
  /** Trả về false nếu lưu thất bại (giữ hộp thoại mở). */
  onAdd: (titles: string[]) => boolean
}

/**
 * "Thêm kịch bản hàng loạt": mỗi dòng là một kịch bản, số tập đánh nối tiếp.
 * Trang cha đổi `key` mỗi lần mở để form luôn trống.
 */
export function BulkAddScriptsDialog({ open, startEpisode, chapterTitles, onClose, onAdd }: BulkAddScriptsDialogProps) {
  const [text, setText] = useState('')
  const titles = useMemo(() => parseBulkTitles(text), [text])
  const overLimit = titles.length > BULK_SCRIPT_LIMIT

  return (
    <ScriptDialogShell
      description="Mỗi dòng là một kịch bản. Số tập được đánh nối tiếp từ tập cuối cùng."
      onClose={onClose}
      onSubmit={() => onAdd(titles)}
      open={open}
      submitDisabled={titles.length === 0 || overLimit}
      submitLabel={titles.length > 0 ? `Thêm ${titles.length} kịch bản` : 'Thêm kịch bản'}
      title="Thêm kịch bản hàng loạt"
    >
      <label className="flex flex-col gap-1.5">
        <span className="flex items-end justify-between gap-3">
          <span className={scriptLabelClass}>Danh sách tên kịch bản</span>
          {chapterTitles.length > 0 && (
            <button
              className="rounded-md px-1.5 py-0.5 text-xs font-medium text-[#39b536] hover:bg-[#eaf7e9]"
              onClick={() => setText(chapterTitles.join('\n'))}
              type="button"
            >
              Điền từ {chapterTitles.length} chương đã nhập
            </button>
          )}
        </span>
        <textarea
          autoFocus
          className="h-[220px] w-full resize-y rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-sm leading-6 text-[#1f2937] outline-none placeholder:text-[#9ca3af] focus:border-[#39b536] focus:ring-2 focus:ring-[#39b536]/15"
          onChange={(event) => setText(event.target.value)}
          placeholder={'Lá thư không tên\nBến xe cuối đường\nNgười gác đèn'}
          value={text}
        />
      </label>

      <p aria-live="polite" className={`mb-0 mt-2 text-xs leading-5 ${overLimit ? 'text-[#dc2626]' : 'text-[#6b7280]'}`}>
        {overLimit
          ? `Tối đa ${BULK_SCRIPT_LIMIT} kịch bản mỗi lần (đang có ${titles.length}).`
          : titles.length > 0
            ? `Sẽ tạo Tập ${startEpisode}${titles.length > 1 ? ` – Tập ${startEpisode + titles.length - 1}` : ''}.`
            : 'Dòng bắt đầu bằng “Tập N:” sẽ được bỏ phần số tập.'}
      </p>
    </ScriptDialogShell>
  )
}
