import { useMemo, useState, type FormEvent } from 'react'
import { FileText, Plus, Search, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { projectPaths } from '@/features/Dashboard/lib/project-display'
import { patchProject } from '@/features/Dashboard/lib/project-storage'
import type { Project } from '@/features/Dashboard/types/project'
import { ConfirmDeleteDialog } from '@/features/story/components/ConfirmDeleteDialog'
import { loadStory } from '@/features/story/lib/story-storage'
import { downloadScripts } from '../lib/export-scripts'
import { removeScriptHistory } from '../lib/script-history'
import { byEpisode, createScript, loadScripts, nextEpisode, saveScripts, scriptHeading, type Script } from '../lib/script-storage'
import { BulkAddScriptsDialog } from './BulkAddScriptsDialog'
import { NewScriptDialog } from './NewScriptDialog'
import { ScriptCard } from './ScriptCard'

type ScriptWorkspaceProps = {
  project: Project
  /** Đọc lại dự án sau khi số kịch bản thay đổi (cập nhật Sidebar / Tổng quan). */
  onProjectChange: () => void
}

const normalize = (value: string) => value.normalize('NFC').trim().toLocaleLowerCase('vi')

const greenButton =
  'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[#39b536] px-3.5 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-[#32a92f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#198c22] disabled:cursor-not-allowed disabled:opacity-60'
const grayButton =
  'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-[#f3f4f6] px-3.5 text-[13px] font-medium text-[#374151] transition-colors hover:bg-[#e5e7eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#f3f4f6]'

/** Nội dung màn hình Kịch bản: thanh công cụ, danh sách thẻ kịch bản (hoặc trạng thái rỗng), các hộp thoại. */
export function ScriptWorkspace({ project, onProjectChange }: ScriptWorkspaceProps) {
  // Lưu theo ID dự án (xem lib/script-storage.ts) – component được gắn key theo project.id
  const [scripts, setScripts] = useState<Script[]>(() => loadScripts(project.id))
  const [queryInput, setQueryInput] = useState('')
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [pendingDelete, setPendingDelete] = useState<Script[] | null>(null)
  /** Hộp thoại đang mở + số lần mở (làm `key` để form luôn trống). */
  const [dialog, setDialog] = useState<{ kind: 'new' | 'bulk' | null; key: number }>({ kind: null, key: 0 })
  const hasScripts = scripts.length > 0

  const visibleScripts = useMemo(() => {
    const keyword = normalize(query)
    if (!keyword) return scripts
    return scripts.filter((script) => normalize(scriptHeading(script)).includes(keyword))
  }, [query, scripts])

  // Chỉ tính các kịch bản còn tồn tại
  const selectedScripts = scripts.filter((script) => selectedIds.has(script.id))
  const allVisibleSelected = visibleScripts.length > 0 && visibleScripts.every((script) => selectedIds.has(script.id))

  /** Ghi danh sách mới cho đúng dự án; cập nhật số kịch bản của dự án nếu thay đổi. */
  function persist(next: Script[]) {
    const sorted = [...next].sort(byEpisode)
    if (!saveScripts(project.id, sorted)) {
      toast.error('Không lưu được thay đổi', { description: 'Bộ nhớ trình duyệt có thể đã đầy.' })
      return false
    }
    setScripts(sorted)
    if (sorted.length !== scripts.length) {
      patchProject(project.id, { scriptCount: sorted.length })
      onProjectChange()
    }
    return true
  }

  const openDialog = (kind: 'new' | 'bulk') => setDialog((current) => ({ kind, key: current.key + 1 }))
  const closeDialog = () => setDialog((current) => ({ ...current, kind: null }))

  function createOne(script: Script) {
    const ok = persist([...scripts, script])
    if (ok) {
      closeDialog()
      toast.success(`Đã tạo ${scriptHeading(script)}`)
    }
    return ok
  }

  function addMany(titles: string[]) {
    const start = nextEpisode(scripts)
    const created = titles.map((title, index) => createScript({ episode: start + index, title }))
    const ok = persist([...scripts, ...created])
    if (ok) {
      closeDialog()
      toast.success(`Đã thêm ${created.length} kịch bản`)
    }
    return ok
  }

  function toggle(ids: string[], checked: boolean) {
    setSelectedIds((current) => {
      const next = new Set(current)
      ids.forEach((id) => (checked ? next.add(id) : next.delete(id)))
      return next
    })
  }

  function deleteScripts(targets: Script[]) {
    const ids = new Set(targets.map((script) => script.id))
    const ok = persist(scripts.filter((script) => !ids.has(script.id)))
    setPendingDelete(null)
    if (!ok) return
    targets.forEach((script) => removeScriptHistory(project.id, script.id))
    setSelectedIds((current) => new Set([...current].filter((id) => !ids.has(id))))
    toast.success(targets.length === 1 ? `Đã xóa ${scriptHeading(targets[0])}` : `Đã xóa ${targets.length} kịch bản`)
  }

  function exportScripts() {
    // Có chọn → xuất phần đã chọn; không chọn → xuất toàn bộ
    const targets = selectedScripts.length > 0 ? selectedScripts : scripts
    if (targets.length === 0) return
    downloadScripts(project.name, targets)
    toast.success(selectedScripts.length > 0 ? `Đã xuất ${targets.length} kịch bản đã chọn` : `Đã xuất toàn bộ ${targets.length} kịch bản`)
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setQuery(queryInput)
  }

  // Tên chương đã nhập ở trang Truyện → gợi ý điền nhanh khi thêm hàng loạt
  const chapterTitles = dialog.kind === 'bulk' ? loadStory(project.id).chapters.map((chapter) => chapter.title || chapter.label) : []

  return (
    <>
      {/* Hàng 1: tìm kiếm + tạo kịch bản */}
      <div className="flex flex-wrap items-center gap-2.5">
        <form className="flex min-w-0 items-center gap-2.5 max-[640px]:w-full" onSubmit={submitSearch} role="search">
          <input
            aria-label="Tìm kiếm tên kịch bản"
            className="h-9 w-[330px] min-w-0 rounded-lg border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#1f2937] outline-none placeholder:text-[#9ca3af] focus:border-[#39b536] focus:ring-2 focus:ring-[#39b536]/15 disabled:bg-[#f9fafb] max-[900px]:w-[240px] max-[640px]:w-auto max-[640px]:flex-1"
            disabled={!hasScripts}
            onChange={(event) => {
              setQueryInput(event.target.value)
              if (!event.target.value) setQuery('')
            }}
            placeholder="Tìm kiếm tên kịch bản..."
            type="search"
            value={queryInput}
          />
          <button className={greenButton} disabled={!hasScripts} type="submit">
            <Search aria-hidden="true" className="size-4" />
            Tìm kiếm
          </button>
        </form>
        <button className={greenButton} onClick={() => openDialog('new')} type="button">
          <Plus aria-hidden="true" className="size-4" />
          Kịch bản mới
        </button>
        <button className={greenButton} onClick={() => openDialog('bulk')} type="button">
          <Plus aria-hidden="true" className="size-4" />
          Thêm kịch bản hàng loạt
        </button>
      </div>

      {/* Hàng 2: thao tác trên danh sách */}
      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <button
          aria-pressed={allVisibleSelected}
          className="inline-flex h-8 shrink-0 items-center rounded-lg border border-[#39b536] bg-white px-3.5 text-[13px] font-medium text-[#39b536] transition-colors hover:bg-[#f3faf2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536] disabled:cursor-not-allowed disabled:border-[#b9e3b6] disabled:text-[#8fd08c] disabled:hover:bg-white"
          disabled={visibleScripts.length === 0}
          onClick={() => toggle(visibleScripts.map((script) => script.id), !allVisibleSelected)}
          type="button"
        >
          {allVisibleSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
        </button>
        <button
          className={grayButton}
          disabled={!hasScripts}
          onClick={exportScripts}
          title={hasScripts ? (selectedScripts.length > 0 ? 'Xuất các kịch bản đã chọn (.txt)' : 'Xuất toàn bộ kịch bản (.txt)') : 'Chưa có kịch bản để xuất'}
          type="button"
        >
          <Upload aria-hidden="true" className="size-4" strokeWidth={1.8} />
          Xuất kịch bản
        </button>
        <button
          className={grayButton}
          disabled={selectedScripts.length === 0}
          onClick={() => setPendingDelete(selectedScripts)}
          title={selectedScripts.length === 0 ? 'Tích chọn kịch bản để xóa' : undefined}
          type="button"
        >
          <Trash2 aria-hidden="true" className="size-4" strokeWidth={1.8} />
          Xóa kịch bản đã chọn
          {selectedScripts.length > 0 && <span className="rounded-full bg-white px-1.5 text-[11px] font-semibold text-[#39b536]">{selectedScripts.length}</span>}
        </button>
      </div>

      {hasScripts ? (
        visibleScripts.length === 0 ? (
          <p className="mt-7 rounded-xl border border-[#e5e7eb] bg-white px-5 py-10 text-center text-sm text-[#6b7280]">
            Không có kịch bản nào khớp với “{query}”.
          </p>
        ) : (
          // Số cột theo bề rộng thật của vùng nội dung (Sidebar kéo rộng/hẹp được): thẻ ≥ 400px, không đủ thì 1 cột
          <ul aria-label="Danh sách kịch bản" className="m-0 mt-7 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,400px),1fr))] gap-5 p-0">
            {visibleScripts.map((script) => (
              <li className="min-w-0" key={script.id}>
                <ScriptCard
                  href={projectPaths.scriptEditor(project.id, script.id)}
                  onDelete={() => setPendingDelete([script])}
                  onToggle={(checked) => toggle([script.id], checked)}
                  script={script}
                  selected={selectedIds.has(script.id)}
                />
              </li>
            ))}
          </ul>
        )
      ) : (
        <section aria-labelledby="script-empty-title" className="grid min-h-[420px] place-items-center px-4 text-center">
          <div className="flex max-w-[420px] flex-col items-center">
            <span className="grid size-12 place-items-center rounded-xl border border-[#d7efd5] bg-[#f3faf2] text-[#39b536]">
              <FileText aria-hidden="true" className="size-6" strokeWidth={1.75} />
            </span>
            <h2 className="mb-0 mt-4 text-base font-bold leading-6 text-[#111827]" id="script-empty-title">
              Dự án chưa có kịch bản
            </h2>
            <p className="mb-0 mt-1.5 text-[13px] leading-[22px] text-[#4b5563]">
              Tạo từng tập kịch bản, hoặc thêm nhiều tập cùng lúc – mỗi dòng là một tập.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2.5">
              <button
                className="min-h-10 rounded-lg bg-[#39b536] px-5 text-[13px] font-medium text-white shadow-sm hover:bg-[#32a92f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#198c22]"
                onClick={() => openDialog('new')}
                type="button"
              >
                Kịch bản mới
              </button>
              <button
                className="min-h-10 rounded-lg border border-[#d1d5db] bg-white px-6 text-[13px] font-medium text-[#111827] hover:bg-gray-50"
                onClick={() => openDialog('bulk')}
                type="button"
              >
                Thêm hàng loạt
              </button>
            </div>
          </div>
        </section>
      )}

      <NewScriptDialog
        episode={nextEpisode(scripts)}
        key={`new-${dialog.key}`}
        onClose={closeDialog}
        onCreate={createOne}
        open={dialog.kind === 'new'}
      />

      <BulkAddScriptsDialog
        chapterTitles={chapterTitles}
        key={`bulk-${dialog.key}`}
        onAdd={addMany}
        onClose={closeDialog}
        open={dialog.kind === 'bulk'}
        startEpisode={nextEpisode(scripts)}
      />

      <ConfirmDeleteDialog
        confirmLabel={pendingDelete && pendingDelete.length > 1 ? `Xóa ${pendingDelete.length} kịch bản` : 'Xóa kịch bản'}
        description={
          pendingDelete?.length === 1
            ? `${scriptHeading(pendingDelete[0])} sẽ bị xóa khỏi dự án. Không thể hoàn tác.`
            : `${pendingDelete?.length ?? 0} kịch bản đã chọn sẽ bị xóa khỏi dự án. Không thể hoàn tác.`
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && deleteScripts(pendingDelete)}
        open={pendingDelete !== null}
        title={pendingDelete && pendingDelete.length > 1 ? 'Xóa các kịch bản đã chọn?' : 'Xóa kịch bản?'}
      />
    </>
  )
}
