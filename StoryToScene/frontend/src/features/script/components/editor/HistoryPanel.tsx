import { useMemo, useState } from 'react'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Dialog } from '@base-ui/react/dialog'
import { History, RotateCcw, Sparkles, UserRound, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { collapseSame, diffLines, type DiffRow } from '../../lib/line-diff'
import { isEmptyBlock, serializeBlocks, splitParenthetical, type ScriptBlock } from '../../lib/script-blocks'
import { formatVersionTime, HISTORY_LIMIT, versionLabel, type ScriptVersion } from '../../lib/script-history'

type HistoryPanelProps = {
  open: boolean
  onClose: () => void
  /** Mới nhất đứng đầu. */
  versions: ScriptVersion[]
  currentBlocks: ScriptBlock[]
  onRestore: (version: ScriptVersion) => void
}

type ViewMode = 'diff' | 'raw'
type DisplayLine = { key: string; block: ScriptBlock; sceneNumber: number }

const formatCount = (value: number) => value.toLocaleString('vi-VN')

/** Dòng hiển thị trong panel (đánh số cảnh); khóa so sánh gồm loại dòng + văn bản. */
function toDisplayLines(blocks: ScriptBlock[]): DisplayLine[] {
  let sceneNumber = 0
  return blocks
    .filter((block) => !isEmptyBlock(block))
    .map((block) => {
      if (block.type === 'scene') sceneNumber++
      const text = block.type === 'scene' ? `Cảnh ${sceneNumber}. ${block.text}` : serializeBlocks([block])
      return { key: `${block.type}|${text}`, block, sceneNumber }
    })
}

function LineText({ line }: { line: DisplayLine }) {
  const { block } = line
  if (block.type === 'scene') return <strong className="font-semibold text-[#111827]">Cảnh {line.sceneNumber}. {block.text}</strong>
  if (block.type === 'transition') return <span className="text-xs font-semibold uppercase tracking-[0.6px]">{block.text}</span>
  if (block.type === 'dialogue') {
    const { note, line: speech } = splitParenthetical(block.text)
    return (
      <>
        <strong className="font-semibold">{block.character || 'Nhân vật'}:</strong> {note && <em className="text-[#6b7280]">({note}) </em>}
        {speech}
      </>
    )
  }
  return <>{block.text}</>
}

/** Panel "Lịch sử bản lưu" trượt từ bên phải: danh sách phiên bản, so sánh / nguyên văn, khôi phục. */
export function HistoryPanel({ open, onClose, versions, currentBlocks, onRestore }: HistoryPanelProps) {
  const currentText = serializeBlocks(currentBlocks.filter((block) => !isEmptyBlock(block)))
  // "Đang dùng" = bản mới nhất có nội dung trùng nội dung hiện tại
  const inUseId = versions.find((version) => serializeBlocks(version.blocks) === currentText)?.id ?? null
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<ViewMode>('diff')
  const [confirming, setConfirming] = useState(false)
  // Mặc định chọn bản gần nhất không phải bản đang dùng (thường là thứ người dùng muốn xem lại)
  const selected = versions.find((version) => version.id === selectedId) ?? versions.find((version) => version.id !== inUseId) ?? versions[0] ?? null
  const selectedInUse = selected?.id === inUseId

  const rows = useMemo<DiffRow<DisplayLine>[]>(() => {
    if (!selected) return []
    if (mode === 'raw') return toDisplayLines(selected.blocks).map((item) => ({ kind: 'same' as const, item }))
    // Từ bản đang dùng → bản đã chọn: đỏ = chỉ có ở bản đang dùng, xanh = chỉ có ở bản đã chọn
    return collapseSame(diffLines(toDisplayLines(currentBlocks), toDisplayLines(selected.blocks), (line) => line.key))
  }, [selected, mode, currentBlocks])
  const changeCount = rows.filter((row) => row.kind === 'add' || row.kind === 'remove').length

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-slate-900/20 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-50 flex w-[min(100vw,500px)] flex-col bg-white font-sans shadow-[-12px_0_40px_-12px_rgba(15,23,42,0.25)] outline-none transition-transform duration-200 ease-out data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full">
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#f1f5f9] px-6 py-5 max-[560px]:px-4">
            <div>
              <Dialog.Title className="m-0 text-lg font-bold leading-7 tracking-[-0.3px] text-[#111827]">Lịch sử bản lưu</Dialog.Title>
              <Dialog.Description className="mb-0 mt-0.5 text-xs leading-5 text-[#6b7280]">Giữ {HISTORY_LIMIT} bản gần nhất của tập này.</Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Đóng lịch sử"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-[#9ca3af] hover:bg-gray-50 hover:text-[#4b5563] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]"
            >
              <X aria-hidden="true" className="size-5" />
            </Dialog.Close>
          </header>

          {versions.length === 0 ? (
            <div className="grid flex-1 place-items-center px-6 text-center">
              <div className="flex max-w-[300px] flex-col items-center">
                <span className="grid size-12 place-items-center rounded-xl border border-[#d7efd5] bg-[#f3faf2] text-[#39b536]">
                  <History aria-hidden="true" className="size-6" strokeWidth={1.75} />
                </span>
                <p className="mb-0 mt-4 text-sm font-semibold text-[#111827]">Chưa có bản lưu nào</p>
                <p className="mb-0 mt-1 text-[13px] leading-5 text-[#6b7280]">Bản lưu được tạo tự động khi bạn sửa nội dung tập.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Danh sách phiên bản */}
              <ul aria-label="Các phiên bản" className="m-0 flex max-h-[38vh] shrink-0 list-none flex-col gap-2.5 overflow-y-auto border-b border-[#f1f5f9] p-4 max-[560px]:px-3" role="listbox">
                {versions.map((version) => {
                  const isSelected = version.id === selected?.id
                  const Icon = version.source === 'assistant' ? Sparkles : version.source === 'restore' ? RotateCcw : UserRound
                  return (
                    <li aria-selected={isSelected} key={version.id} role="option">
                      <button
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl border bg-white px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]',
                          isSelected ? 'border-[#39b536] bg-[#f3faf2] ring-1 ring-[#39b536]' : 'border-[#e5e7eb] hover:border-[#b9e3b6]',
                        )}
                        onClick={() => setSelectedId(version.id)}
                        type="button"
                      >
                        <span className="w-8 shrink-0 text-[13px] font-bold text-[#111827]">v{version.number}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-[#111827]">
                            <Icon aria-hidden="true" className={cn('size-3.5 shrink-0', version.source === 'assistant' ? 'text-[#39b536]' : 'text-[#9ca3af]')} />
                            <span className="truncate">{versionLabel(version)}</span>
                          </span>
                          <span className="mt-0.5 block text-xs text-[#9ca3af]">
                            {formatVersionTime(version.savedAt)} · {formatCount(version.charCount)} ký tự
                          </span>
                        </span>
                        {version.id === inUseId && (
                          <span className="shrink-0 rounded-full border border-[#b9e3b6] bg-[#eaf7e9] px-2.5 py-0.5 text-[11px] font-semibold text-[#2f9a2d]">Đang dùng</span>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>

              {selected && (
                <div className="flex min-h-0 flex-1 flex-col gap-3 p-4 max-[560px]:px-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div aria-label="Chế độ xem" className="inline-flex rounded-lg bg-[#f3f4f6] p-1" role="tablist">
                      {(
                        [
                          ['diff', 'So với bản đang dùng'],
                          ['raw', 'Nguyên văn'],
                        ] as const
                      ).map(([value, label]) => (
                        <button
                          aria-selected={mode === value}
                          className={cn(
                            'h-8 rounded-md px-3 text-[13px] font-medium transition-colors',
                            mode === value ? 'bg-white text-[#111827] shadow-sm' : 'text-[#6b7280] hover:text-[#374151]',
                          )}
                          key={value}
                          onClick={() => setMode(value)}
                          role="tab"
                          type="button"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <button
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#39b536] px-4 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#32a92f] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={selectedInUse}
                      onClick={() => setConfirming(true)}
                      title={selectedInUse ? 'Phiên bản này đang được dùng' : undefined}
                      type="button"
                    >
                      <RotateCcw aria-hidden="true" className="size-4" />
                      Khôi phục v{selected.number}
                    </button>
                  </div>

                  {mode === 'diff' && !selectedInUse && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#4b5563]">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="grid size-4 place-items-center rounded bg-[#eaf7e9] font-bold text-[#2f9a2d]">+</span>
                        chỉ có ở v{selected.number}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="grid size-4 place-items-center rounded bg-[#fef2f2] font-bold text-[#dc2626]">−</span>
                        chỉ có ở bản đang dùng
                      </span>
                      <span className="text-[#9ca3af]">{changeCount} dòng khác nhau</span>
                    </div>
                  )}

                  <div aria-label={mode === 'diff' ? `So sánh v${selected.number} với bản đang dùng` : `Nguyên văn v${selected.number}`} className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-[#e5e7eb] text-[13px] leading-6 text-[#1f2937]">
                    {mode === 'diff' && selectedInUse ? (
                      <p className="m-0 px-4 py-10 text-center text-[13px] text-[#6b7280]">Đây là phiên bản đang dùng – không có khác biệt.</p>
                    ) : rows.length === 0 ? (
                      <p className="m-0 px-4 py-10 text-center text-[13px] text-[#6b7280]">Phiên bản này không có nội dung.</p>
                    ) : (
                      rows.map((row, index) =>
                        row.kind === 'skip' ? (
                          <p className="m-0 bg-[#f9fafb] px-4 py-1.5 text-xs italic text-[#9ca3af]" key={`skip-${index}`}>
                            … {row.count} dòng giống nhau …
                          </p>
                        ) : (
                          <div
                            className={cn(
                              'flex gap-2 px-4 py-1.5',
                              row.kind === 'add' && 'bg-[#f0faef] text-[#1e6b1c]',
                              row.kind === 'remove' && 'bg-[#fef2f2] text-[#b91c1c]',
                              row.item.block.type === 'scene' && index > 0 && 'mt-2',
                            )}
                            key={`${row.kind}-${index}`}
                          >
                            {mode === 'diff' && (
                              <span aria-label={row.kind === 'add' ? 'Thêm' : row.kind === 'remove' ? 'Bỏ' : undefined} className="w-3 shrink-0 select-none font-bold">
                                {row.kind === 'add' ? '+' : row.kind === 'remove' ? '−' : ''}
                              </span>
                            )}
                            <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">
                              <LineText line={row.item} />
                            </span>
                          </div>
                        ),
                      )
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Xác nhận khôi phục */}
          <AlertDialog.Root open={confirming} onOpenChange={setConfirming}>
            <AlertDialog.Portal>
              <AlertDialog.Backdrop className="fixed inset-0 z-[60] bg-slate-900/30" />
              <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-[60] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 font-sans shadow-2xl outline-none">
                <AlertDialog.Title className="m-0 text-base font-bold leading-6 text-[#111827]">Khôi phục v{selected?.number}?</AlertDialog.Title>
                <AlertDialog.Description className="mb-0 mt-1.5 text-[13px] leading-5 text-[#6b7280]">
                  Nội dung tập sẽ được thay bằng v{selected?.number} ({selected ? formatVersionTime(selected.savedAt) : ''}). Bản đang dùng vẫn được giữ trong lịch sử nên bạn có thể khôi phục lại.
                </AlertDialog.Description>
                <div className="mt-5 flex justify-end gap-2.5">
                  <AlertDialog.Close className="min-h-9 rounded-lg border border-[#e2e8f0] bg-white px-4 text-xs text-[#334155] hover:bg-slate-50">Hủy</AlertDialog.Close>
                  <button
                    className="min-h-9 rounded-lg bg-[#39b536] px-4 text-xs font-bold text-white hover:bg-[#32a92f]"
                    onClick={() => {
                      setConfirming(false)
                      if (selected) onRestore(selected)
                      setSelectedId(null)
                    }}
                    type="button"
                  >
                    Khôi phục
                  </button>
                </div>
              </AlertDialog.Popup>
            </AlertDialog.Portal>
          </AlertDialog.Root>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
