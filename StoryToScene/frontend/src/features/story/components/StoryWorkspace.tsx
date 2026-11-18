import { useMemo, useRef, useState, type FormEvent } from 'react'
import { AlignJustify, BookOpen, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { patchProject } from '@/features/Dashboard/lib/project-storage'
import type { Project } from '@/features/Dashboard/types/project'
import { normalizeStoryText, type ParsedChapter } from '../lib/chapter-parser'
import { ACCEPTED_STORY_FILES, readStoryFile, StoryFileError } from '../lib/read-story-file'
import { CHAPTER_PAGE_SIZES, DEFAULT_VOLUME, loadStory, saveStory, type StoredStory, type StoryChapter } from '../lib/story-storage'
import { ChapterTable } from './ChapterTable'
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog'
import { EditChapterDialog } from './EditChapterDialog'
import { ImportStoryDialog } from './ImportStoryDialog'

const byChapterNumber = (a: StoryChapter, b: StoryChapter) => a.index - b.index

type StoryWorkspaceProps = {
  project: Project
  /** Đọc lại dự án sau khi số chương thay đổi (cập nhật Sidebar / Tổng quan). */
  onProjectChange: () => void
}

/** Nội dung màn hình Truyện: thanh công cụ, trạng thái trống hoặc danh sách chương, modal nhập bản gốc. */
export function StoryWorkspace({ project, onProjectChange }: StoryWorkspaceProps) {
  // Lưu theo ID dự án (xem lib/story-storage.ts) – component được gắn key theo project.id
  const [story, setStory] = useState<StoredStory>(() => loadStory(project.id))
  const [dialogOpen, setDialogOpen] = useState(false)
  /** Nội dung đọc từ nút "Tải file" – điền sẵn vào modal nhưng chưa lưu. */
  const [fileText, setFileText] = useState<string | undefined>()
  const [queryInput, setQueryInput] = useState('')
  const [query, setQuery] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<StoryChapter | null>(null)
  /** Chương chờ xác nhận xóa (1 chương hoặc xóa hàng loạt). */
  const [pendingDelete, setPendingDelete] = useState<StoryChapter[] | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(CHAPTER_PAGE_SIZES[0])
  const hasChapters = story.chapters.length > 0

  const visibleChapters = useMemo(() => {
    const keyword = normalizeStoryText(query).trim().toLocaleLowerCase('vi')
    const sorted = [...story.chapters].sort(byChapterNumber)
    if (!keyword) return sorted
    return sorted.filter((chapter) => `${chapter.label} ${chapter.title}`.toLocaleLowerCase('vi').includes(keyword))
  }, [query, story.chapters])

  const pageCount = Math.max(1, Math.ceil(visibleChapters.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pageRows = visibleChapters.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  // Chỉ tính các chương còn tồn tại (đã xóa thì bỏ khỏi lựa chọn)
  const selectedChapters = story.chapters.filter((chapter) => selectedIds.has(chapter.id))

  /** Ghi danh sách chương mới cho đúng dự án; cập nhật số chương của dự án nếu thay đổi. */
  function persistChapters(chapters: StoryChapter[]) {
    const next: StoredStory = { ...story, chapters }
    if (!saveStory(project.id, next)) {
      toast.error('Không lưu được thay đổi', { description: 'Bộ nhớ trình duyệt có thể đã đầy.' })
      return false
    }
    setStory(next)
    if (chapters.length !== story.chapters.length) {
      patchProject(project.id, { chapterCount: chapters.length })
      onProjectChange()
    }
    return true
  }

  function toggleSelection(ids: string[], checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current)
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)))
      return next
    })
  }

  function saveChapter(updated: StoryChapter) {
    // Giữ nguyên ID: thay đúng chương có cùng ID, không thêm chương mới
    const ok = persistChapters(story.chapters.map((chapter) => (chapter.id === updated.id ? updated : chapter)))
    if (ok) {
      setEditing(null)
      toast.success(`Đã lưu ${updated.label}`)
    }
    return ok
  }

  function deleteChapters(targets: StoryChapter[]) {
    const ids = new Set(targets.map((chapter) => chapter.id))
    const ok = persistChapters(story.chapters.filter((chapter) => !ids.has(chapter.id)))
    setPendingDelete(null)
    if (!ok) return
    setSelectedIds((current) => new Set([...current].filter((id) => !ids.has(id))))
    toast.success(targets.length === 1 ? `Đã xóa ${targets[0].label}` : `Đã xóa ${targets.length} chương`)
  }

  function openDialog(text?: string) {
    setFileText(text)
    setDialogOpen(true)
  }

  async function handleFile(file: File | undefined) {
    if (!file) return
    try {
      const content = await readStoryFile(file)
      if (!content.trim()) throw new StoryFileError('Tệp không có nội dung văn bản.')
      openDialog(content)
    } catch (error) {
      toast.error(error instanceof StoryFileError ? error.message : 'Không đọc được tệp.')
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  function saveSource(source: string) {
    const next: StoredStory = { ...story, source, sourceSavedAt: new Date().toISOString() }
    if (!saveStory(project.id, next)) return false
    setStory(next)
    return true
  }

  function confirmImport(source: string, chapters: ParsedChapter[]) {
    const now = new Date().toISOString()
    const next: StoredStory = {
      source,
      sourceSavedAt: now,
      chapters: chapters.map((chapter) => ({ ...chapter, id: crypto.randomUUID(), volume: DEFAULT_VOLUME })),
      importedAt: now,
    }
    if (!saveStory(project.id, next)) return false
    setStory(next)
    setSelectedIds(new Set())
    setPage(1)
    patchProject(project.id, { chapterCount: chapters.length })
    onProjectChange()
    setDialogOpen(false)
    toast.success(`Đã nhập ${chapters.length} chương vào dự án`)
    return true
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setQuery(queryInput)
    setPage(1)
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#39b536] px-3.5 text-[13px] font-medium text-white shadow-sm hover:bg-[#32a92f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#198c22]"
            onClick={() => openDialog()}
            type="button"
          >
            <Plus aria-hidden="true" className="size-4" />
            Nhập bản gốc
          </button>
          <button
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#eaf7e9] px-3.5 text-[13px] font-medium text-[#39b536] hover:bg-[#dcf2da] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={selectedChapters.length === 0}
            onClick={() => setPendingDelete(selectedChapters)}
            title={selectedChapters.length === 0 ? 'Tích chọn chương để xóa hàng loạt' : undefined}
            type="button"
          >
            <Trash2 aria-hidden="true" className="size-4" />
            Xóa hàng loạt
            {selectedChapters.length > 0 && <span className="rounded-full bg-white px-1.5 text-[11px] font-semibold">{selectedChapters.length}</span>}
          </button>
          <button
            aria-disabled="true"
            className="inline-flex min-h-9 cursor-not-allowed items-center gap-1.5 rounded-lg bg-[#f3f4f6] px-3.5 text-[13px] font-medium text-[#374151] opacity-70"
            title="Sắp ra mắt"
            type="button"
          >
            <AlignJustify aria-hidden="true" className="size-4" />
            Phân tích sự kiện
          </button>
        </div>

        <form className="flex items-center gap-2 max-[560px]:w-full" onSubmit={submitSearch} role="search">
          <input
            aria-label="Tìm theo tên chương"
            className="h-9 w-[230px] rounded-lg border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#1f2937] outline-none placeholder:text-[#9ca3af] focus:border-[#39b536] focus:ring-2 focus:ring-[#39b536]/15 disabled:bg-[#f9fafb] max-[560px]:min-w-0 max-[560px]:flex-1"
            disabled={!hasChapters}
            onChange={(event) => {
              setQueryInput(event.target.value)
              if (!event.target.value) setQuery('')
            }}
            placeholder="Tìm theo tên chương..."
            type="search"
            value={queryInput}
          />
          <button
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#39b536] px-3.5 text-[13px] font-medium text-white shadow-sm hover:bg-[#32a92f] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!hasChapters}
            type="submit"
          >
            <Search aria-hidden="true" className="size-4" />
            Tìm kiếm
          </button>
        </form>
      </div>

      {hasChapters ? (
        visibleChapters.length === 0 ? (
          <p className="mt-5 rounded-xl border border-[#e5e7eb] bg-white px-5 py-10 text-center text-sm text-[#6b7280]">
            Không có chương nào khớp với “{query}”.
          </p>
        ) : (
          <ChapterTable
            filteredIds={visibleChapters.map((chapter) => chapter.id)}
            onDelete={(chapter) => setPendingDelete([chapter])}
            onEdit={setEditing}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
            onToggle={toggleSelection}
            page={currentPage}
            pageSize={pageSize}
            rows={pageRows}
            selectedIds={selectedIds}
            total={visibleChapters.length}
          />
        )
      ) : (
        <section aria-labelledby="story-empty-title" className="grid min-h-[440px] place-items-center px-4 text-center">
          <div className="flex max-w-[420px] flex-col items-center">
            <span className="grid size-12 place-items-center rounded-xl border border-[#d7efd5] bg-[#f3faf2] text-[#39b536]">
              <BookOpen aria-hidden="true" className="size-6" strokeWidth={1.75} />
            </span>
            <h2 id="story-empty-title" className="mb-0 mt-4 text-base font-bold leading-6 text-[#111827]">
              Dự án chưa có truyện
            </h2>
            <p className="mb-0 mt-1.5 text-[13px] leading-[22px] text-[#4b5563]">
              Dán truyện hoặc tải file lên. StoryToScene tự tách chương theo các dòng “Chương N” hoặc “Hồi N”.
            </p>
            <div className="mt-5 flex gap-2.5">
              <button
                className="min-h-10 rounded-lg bg-[#39b536] px-5 text-[13px] font-medium text-white shadow-sm hover:bg-[#32a92f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#198c22]"
                onClick={() => openDialog()}
                type="button"
              >
                Dán truyện
              </button>
              <button
                className="min-h-10 rounded-lg border border-[#d1d5db] bg-white px-6 text-[13px] font-medium text-[#111827] hover:bg-gray-50"
                onClick={() => fileInput.current?.click()}
                type="button"
              >
                Tải file
              </button>
            </div>
            <p className="mb-0 mt-3 text-[11px] leading-4 text-[#9ca3af]">File .txt hoặc .docx, nên dưới 10 MB</p>
          </div>
        </section>
      )}

      <input
        accept={ACCEPTED_STORY_FILES}
        aria-hidden="true"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
        ref={fileInput}
        tabIndex={-1}
        type="file"
      />

      <EditChapterDialog
        chapter={editing}
        onClose={() => setEditing(null)}
        onSave={saveChapter}
        otherChapters={editing ? story.chapters.filter((chapter) => chapter.id !== editing.id) : []}
      />

      <ConfirmDeleteDialog
        confirmLabel={pendingDelete && pendingDelete.length > 1 ? `Xóa ${pendingDelete.length} chương` : 'Xóa chương'}
        description={
          pendingDelete?.length === 1
            ? `${pendingDelete[0].label}${pendingDelete[0].title ? `: ${pendingDelete[0].title}` : ''} sẽ bị xóa khỏi dự án. Không thể hoàn tác.`
            : `${pendingDelete?.length ?? 0} chương đã chọn sẽ bị xóa khỏi dự án. Không thể hoàn tác.`
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && deleteChapters(pendingDelete)}
        open={pendingDelete !== null}
        title={pendingDelete && pendingDelete.length > 1 ? 'Xóa các chương đã chọn?' : 'Xóa chương?'}
      />

      <ImportStoryDialog
        existingChapterCount={story.chapters.length}
        initialText={fileText}
        onClose={() => setDialogOpen(false)}
        onConfirm={confirmImport}
        onSaveSource={saveSource}
        open={dialogOpen}
        savedSource={story.source}
      />
    </>
  )
}
