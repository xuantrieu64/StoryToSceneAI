import { ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import { CHAPTER_PAGE_SIZES, chapterVolume, type StoryChapter } from '../lib/story-storage'

/** Các số trang hiển thị: 1 … (trang hiện tại ±1) … trang cuối; null = dấu "…". */
function pageItems(page: number, pageCount: number): (number | null)[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1)
  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pageCount))
  const sorted = [...pages].sort((a, b) => a - b)
  return sorted.flatMap((n, i) => (i > 0 && n - sorted[i - 1] > 1 ? [null, n] : [n]))
}

type ChapterTableProps = {
  /** Các chương của trang hiện tại. */
  rows: StoryChapter[]
  /** ID mọi chương đang hiển thị theo bộ lọc (mọi trang) – dùng cho "chọn tất cả". */
  filteredIds: string[]
  selectedIds: Set<string>
  total: number
  page: number
  pageSize: number
  onToggle: (ids: string[], checked: boolean) => void
  onEdit: (chapter: StoryChapter) => void
  onDelete: (chapter: StoryChapter) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

/** Bảng chương đã lưu: checkbox · Chương · Tập · Tên chương · Nội dung · Sự kiện · Thao tác + phân trang. */
export function ChapterTable({
  rows,
  filteredIds,
  selectedIds,
  total,
  page,
  pageSize,
  onToggle,
  onEdit,
  onDelete,
  onPageChange,
  onPageSizeChange,
}: ChapterTableProps) {
  const selectedInFilter = filteredIds.filter((id) => selectedIds.has(id)).length
  const allSelected = filteredIds.length > 0 && selectedInFilter === filteredIds.length
  const someSelected = selectedInFilter > 0 && !allSelected
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  return (
    <section aria-label="Danh sách chương" className="mt-5 overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm leading-5">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-[#f9fafb] text-[#6b7280]">
              <th className="w-12 py-3 pl-5 pr-2" scope="col">
                <input
                  aria-label={allSelected ? 'Bỏ chọn tất cả chương' : 'Chọn tất cả chương'}
                  checked={allSelected}
                  className="size-4 cursor-pointer accent-[#39b536]"
                  onChange={(event) => onToggle(filteredIds, event.target.checked)}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected
                  }}
                  type="checkbox"
                />
              </th>
              <th className="w-[84px] px-3 py-3 font-medium" scope="col">Chương</th>
              <th className="w-[112px] px-3 py-3 font-medium" scope="col">Tập</th>
              <th className="w-[22%] px-3 py-3 font-medium" scope="col">Tên chương</th>
              <th className="px-3 py-3 font-medium" scope="col">Nội dung chương</th>
              <th className="w-[130px] px-3 py-3 font-medium" scope="col">Sự kiện</th>
              <th className="w-[196px] px-3 py-3 text-center font-medium" scope="col">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((chapter) => {
              const checked = selectedIds.has(chapter.id)
              const name = chapter.title || chapter.label
              return (
                <tr className={`border-b border-[#f1f5f9] last:border-b-0 ${checked ? 'bg-[#f3faf2]' : 'hover:bg-[#f9fafb]'}`} key={chapter.id}>
                  <td className="py-3.5 pl-5 pr-2 align-top">
                    <input
                      aria-label={`Chọn ${chapter.label}${chapter.title ? `: ${chapter.title}` : ''}`}
                      checked={checked}
                      className="size-4 cursor-pointer accent-[#39b536]"
                      onChange={(event) => onToggle([chapter.id], event.target.checked)}
                      type="checkbox"
                    />
                  </td>
                  <td className="px-3 py-3.5 align-top font-medium text-[#111827]" title={chapter.label}>
                    {chapter.index}
                  </td>
                  <td className="px-3 py-3.5 align-top font-medium text-[#111827]">{chapterVolume(chapter)}</td>
                  <td className="px-3 py-3.5 align-top font-medium text-[#111827]">
                    <span className="line-clamp-2 break-words">{name}</span>
                  </td>
                  <td className="px-3 py-3.5 align-top text-[13px] text-[#4b5563]">
                    <span className="line-clamp-2 break-words">{chapter.content || 'Không có'}</span>
                    <span className="mt-0.5 block text-xs text-[#9ca3af]">{chapter.wordCount.toLocaleString('vi-VN')} chữ</span>
                  </td>
                  <td className="px-3 py-3.5 align-top text-[13px] text-[#9ca3af]">Chưa phân tích</td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        aria-label={`Chỉnh sửa ${chapter.label}`}
                        className="inline-flex min-h-8 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[13px] text-[#374151] hover:bg-[#f3f4f6] focus-visible:outline-2 focus-visible:outline-[#39b536]"
                        onClick={() => onEdit(chapter)}
                        type="button"
                      >
                        <Pencil aria-hidden="true" className="size-3.5" />
                        Chỉnh sửa
                      </button>
                      <button
                        aria-label={`Xóa ${chapter.label}`}
                        className="inline-flex min-h-8 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[13px] text-[#dc2626] hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-[#dc2626]"
                        onClick={() => onDelete(chapter)}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" className="size-3.5" />
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f1f5f9] px-5 py-3 text-[13px] text-[#6b7280]">
        <span aria-live="polite">
          Tổng {total} mục
          {selectedInFilter > 0 && <span className="text-[#39b536]"> · Đã chọn {selectedInFilter}</span>}
        </span>
        <div className="flex items-center gap-3">
          <select
            aria-label="Số chương mỗi trang"
            className="h-8 rounded-md border border-[#e5e7eb] bg-white px-2 text-[13px] text-[#374151] outline-none focus:border-[#39b536]"
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            value={pageSize}
          >
            {CHAPTER_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} / trang
              </option>
            ))}
          </select>
          <nav aria-label="Phân trang" className="flex items-center gap-1">
            <button
              aria-label="Trang trước"
              className="grid size-8 place-items-center rounded-md hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </button>
            {pageItems(page, pageCount).map((n, i) =>
              n === null ? (
                <span aria-hidden="true" className="px-1 text-[#9ca3af]" key={`gap-${i}`}>
                  …
                </span>
              ) : (
              <button
                aria-current={n === page ? 'page' : undefined}
                className={`grid h-8 min-w-8 place-items-center rounded-md px-2 text-[13px] ${
                  n === page ? 'bg-[#39b536] font-semibold text-white' : 'text-[#374151] hover:bg-[#f3f4f6]'
                }`}
                key={n}
                onClick={() => onPageChange(n)}
                type="button"
              >
                {n}
              </button>
              ),
            )}
            <button
              aria-label="Trang sau"
              className="grid size-8 place-items-center rounded-md hover:bg-[#f3f4f6] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={page >= pageCount}
              onClick={() => onPageChange(page + 1)}
              type="button"
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </nav>
        </div>
      </footer>
    </section>
  )
}
