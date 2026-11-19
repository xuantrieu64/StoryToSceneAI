import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FileText, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  blocksFromScript,
  convertBlock,
  countCharacters,
  countType,
  createBlock,
  groupByScene,
  isEmptyBlock,
  nextTypeAfter,
  SCRIPT_EDITOR_LIMIT,
  type BlockType,
  type SceneGroup,
  type ScriptBlock,
} from '../../lib/script-blocks'
import { ensureBaseline, recordVersion, type ScriptVersion } from '../../lib/script-history'
import { saveScriptBlocks, type Script } from '../../lib/script-storage'
import { AddLineBar, SceneHeading, ScriptLine, type LineHandlers } from './EditorLines'
import { EditorToolbar, type EditorMode } from './EditorToolbar'
import { HistoryPanel } from './HistoryPanel'
import { ReadingView } from './ReadingView'
import type { CommitIntent, LineDraft } from './LineEditor'

type ScriptEditorProps = {
  projectId: string
  script: Script
  /** Các tập của dự án (để chuyển tập từ thanh công cụ). */
  scripts: Script[]
}

const formatCount = (value: number) => value.toLocaleString('vi-VN')
const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="rounded border border-[#e5e7eb] bg-white px-1 font-sans text-[11px] font-medium text-[#374151]">{children}</kbd>
)

/**
 * Trang Biên tập một tập kịch bản. Mỗi thay đổi được lưu ngay theo projectId + scriptId
 * (xem saveScriptBlocks), nên quay lại danh sách là thấy nội dung mới.
 */
export function ScriptEditor({ projectId, script, scripts }: ScriptEditorProps) {
  const [blocks, setBlocks] = useState<ScriptBlock[]>(() => blocksFromScript(script))
  /*
   * Luôn tính từ bản mới nhất: khi đang sửa một dòng mà bấm nút khác, "blur" (lưu dòng)
   * chạy trước "click" trong cùng lượt render → handler của click phải đọc ref, không đọc state cũ.
   */
  const latest = useRef(blocks)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ id: string; value: LineDraft } | null>(null)
  const [mode, setMode] = useState<EditorMode>('edit')
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  /** Mỗi lần mở trang là một phiên: các lần tự lưu liên tiếp trong phiên được gộp vào một bản lưu. */
  const sessionId = useRef(crypto.randomUUID())
  const [history, setHistory] = useState<ScriptVersion[]>(() =>
    ensureBaseline(projectId, script.id, blocks.filter((block) => !isEmptyBlock(block)), script.updatedAt),
  )
  const [historyOpen, setHistoryOpen] = useState(false)

  const groups = groupByScene(blocks)
  const sceneGroups = groups.filter((group) => group.scene)
  // Đếm theo thời gian thực: thay dòng đang sửa bằng nội dung đang gõ
  const charCount = countCharacters(draft ? blocks.map((block) => (block.id === draft.id ? { ...block, ...draft.value } : block)) : blocks)
  // Nhân vật nói đầu tiên được nhấn màu xanh
  const primarySpeaker = blocks.find((block) => block.type === 'dialogue' && block.character?.trim())?.character?.trim().toLocaleLowerCase('vi')

  /**
   * Ghi danh sách dòng mới (state + bộ nhớ) và cập nhật lịch sử bản lưu.
   * `nextEditing` undefined = giữ dòng đang sửa; `recordAs` false = không ghi lịch sử (khôi phục tự ghi riêng).
   */
  function apply(next: ScriptBlock[], nextEditing?: string | null, recordAs: 'manual' | false = 'manual') {
    if (countCharacters(next) > SCRIPT_EDITOR_LIMIT) {
      toast.error(`Kịch bản vượt giới hạn ${formatCount(SCRIPT_EDITOR_LIMIT)} ký tự`, { description: 'Hãy rút gọn nội dung dòng đang sửa.' })
      return false
    }
    latest.current = next
    setBlocks(next)
    if (nextEditing !== undefined) {
      setEditingId(nextEditing)
      setDraft(null)
    }
    const saved = saveScriptBlocks(projectId, script.id, next)
    if (!saved) {
      toast.error('Không lưu được thay đổi', { description: 'Bộ nhớ trình duyệt có thể đã đầy.' })
    } else if (recordAs) {
      // Nội dung không đổi (vd. vừa thêm một dòng trống) → recordVersion không tạo bản mới
      setHistory(recordVersion(projectId, script.id, saved.blocks ?? [], { source: recordAs, sessionId: sessionId.current }))
    }
    return true
  }

  /** Khôi phục một phiên bản: thay nội dung tập và ghi một bản "Khôi phục từ vN" mới nhất. */
  function restoreVersion(version: ScriptVersion) {
    const restored = version.blocks.map((block) => ({ ...block }))
    if (!apply(restored, null, false)) return
    setHistory(recordVersion(projectId, script.id, restored, { source: 'restore', restoredFrom: version.number }))
    // Lần sửa tiếp theo sau khi khôi phục sẽ là một bản mới, không gộp vào bản trước đó
    sessionId.current = crypto.randomUUID()
    // Đóng panel để thấy ngay nội dung đã khôi phục (thông báo góc phải không còn đè lên nút đóng panel)
    setHistoryOpen(false)
    toast.success(`Đã khôi phục v${version.number}`, { description: 'Mở Lịch sử để xem hoặc khôi phục lại bản trước.' })
  }

  function commit(id: string, value: LineDraft, intent: CommitIntent) {
    const current = latest.current
    const index = current.findIndex((block) => block.id === id)
    if (index < 0) return true
    const updated: ScriptBlock = { ...current[index], ...value }
    // Dòng để trống khi rời đi → bỏ dòng
    if (isEmptyBlock(updated)) return apply(current.filter((block) => block.id !== id), null)
    const next = current.map((block) => (block.id === id ? updated : block))
    if (intent === 'next') {
      const added = createBlock(nextTypeAfter(updated.type))
      next.splice(index + 1, 0, added)
      return apply(next, added.id)
    }
    return apply(next, null)
  }

  function deleteEmpty(id: string) {
    const current = latest.current
    const index = current.findIndex((block) => block.id === id)
    apply(
      current.filter((block) => block.id !== id),
      index > 0 ? current[index - 1].id : null,
    )
  }

  function changeType(id: string, type: BlockType) {
    apply(latest.current.map((block) => (block.id === id ? convertBlock(block, type) : block)))
  }

  function deleteLine(id: string) {
    const current = latest.current
    const index = current.findIndex((block) => block.id === id)
    if (index < 0) return
    const removed = current[index]
    apply(
      current.filter((block) => block.id !== id),
      editingId === id ? null : undefined,
    )
    toast.success(`Đã xóa dòng ${removed.type === 'scene' ? 'Cảnh' : ''}`.trim(), {
      action: {
        label: 'Hoàn tác',
        onClick: () => {
          const now = latest.current
          // Chèn lại sau dòng đứng trước nó (nếu còn), không thì về đầu
          const before = index > 0 ? now.findIndex((block) => block.id === current[index - 1].id) : -1
          apply([...now.slice(0, before + 1), removed, ...now.slice(before + 1)])
        },
      },
    })
  }

  /** Thêm dòng vào cuối một cảnh (Cảnh mới = mở cảnh mới ngay sau cảnh đó). */
  function addLine(group: SceneGroup | null, type: BlockType) {
    const current = latest.current
    const last = group ? (group.lines.at(-1) ?? group.scene) : null
    const at = last ? current.findIndex((block) => block.id === last.id) + 1 : current.length
    const added = createBlock(type)
    apply([...current.slice(0, at), added, ...current.slice(at)], added.id)
  }

  function handlersFor(block: ScriptBlock): LineHandlers {
    return {
      onStartEdit: () => {
        setEditingId(block.id)
        setDraft(null)
      },
      onCommit: (value, intent) => commit(block.id, value, intent),
      onDeleteEmpty: () => deleteEmpty(block.id),
      onDraftChange: (value) => setDraft({ id: block.id, value }),
      onChangeType: (type) => changeType(block.id, type),
      onDelete: () => deleteLine(block.id),
    }
  }

  function changeMode(next: EditorMode) {
    setEditingId(null)
    setDraft(null)
    setMode(next)
  }

  /* ---------------------------- Đi tới cảnh + theo dõi cuộn ---------------------------- */

  const toolbarOffset = () => (toolbarRef.current?.getBoundingClientRect().bottom ?? 0) + 12
  /** Cảnh vừa chọn ở "Đi tới cảnh" – các cảnh cuối trang không cuộn lên tới thanh công cụ được. */
  const jumpTarget = useRef<string | null>(null)

  function jumpToScene(sceneId: string) {
    const el = document.getElementById(`scene-${sceneId}`)
    if (!el) return
    jumpTarget.current = sceneId
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - toolbarOffset(), behavior: 'smooth' })
    setActiveSceneId(sceneId)
  }

  const sceneIds = sceneGroups.map((group) => group.scene!.id).join(',')
  useEffect(() => {
    const ids = sceneIds ? sceneIds.split(',') : []
    let frame = 0
    function update() {
      frame = 0
      const line = toolbarOffset() + 24
      let active = ids[0] ?? null
      const visible: string[] = []
      for (const id of ids) {
        const top = document.getElementById(`scene-${id}`)?.getBoundingClientRect().top
        if (top === undefined) continue
        if (top <= line) active = id
        if (top < window.innerHeight) visible.push(id)
      }
      // Đã cuộn hết trang: cảnh vừa chọn vẫn đang hiện thì giữ nó là cảnh hiện tại
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      if (atBottom && jumpTarget.current && visible.includes(jumpTarget.current)) active = jumpTarget.current
      setActiveSceneId(active)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [sceneIds, mode])

  /* -------------------------------------- Hiển thị -------------------------------------- */

  return (
    <div className="rounded-xl border border-[#eceef1] bg-white">
      <EditorToolbar
        activeSceneId={activeSceneId}
        charCount={charCount}
        charLimit={SCRIPT_EDITOR_LIMIT}
        mode={mode}
        onJumpToScene={jumpToScene}
        onModeChange={changeMode}
        projectId={projectId}
        ref={toolbarRef}
        scenes={sceneGroups}
        script={script}
        scripts={scripts}
        historyOpen={historyOpen}
        onOpenHistory={() => {
          setEditingId(null)
          setDraft(null)
          setHistoryOpen(true)
        }}
      />

      <HistoryPanel
        currentBlocks={blocks}
        onClose={() => setHistoryOpen(false)}
        onRestore={restoreVersion}
        open={historyOpen}
        versions={history}
      />

      <div className="px-6 pb-8 pt-5 max-[760px]:px-4">
        {blocks.length === 0 ? (
          <EmptyScript mode={mode} onAdd={(type) => addLine(null, type)} />
        ) : mode === 'read' ? (
          <ReadingView blocks={blocks} />
        ) : (
          <>
            <p className="mb-4 mt-0 text-xs leading-5 text-[#9ca3af] max-[560px]:hidden">
              Bấm vào một dòng để sửa · <Kbd>Enter</Kbd> thêm dòng · <Kbd>Shift+Enter</Kbd> xuống dòng · <Kbd>Esc</Kbd> xong · Bấm nhãn bên trái để đổi loại hoặc xóa dòng
            </p>
            <div className="flex flex-col gap-9">
              {groups.map((group) => (
                <section className="flex scroll-mt-40 flex-col gap-2.5" id={group.scene ? `scene-${group.scene.id}` : undefined} key={group.scene?.id ?? 'intro'}>
                  {group.scene && (
                    <SceneHeading
                      actionCount={countType(group.lines, 'action')}
                      block={group.scene}
                      dialogueCount={countType(group.lines, 'dialogue')}
                      editing={editingId === group.scene.id}
                      number={group.number}
                      {...handlersFor(group.scene)}
                    />
                  )}
                  {group.lines.map((line) => (
                    <ScriptLine
                      block={line}
                      editing={editingId === line.id}
                      key={line.id}
                      speakerTone={line.character?.trim().toLocaleLowerCase('vi') === primarySpeaker ? 'primary' : 'muted'}
                      {...handlersFor(line)}
                    />
                  ))}
                  <AddLineBar onAdd={(type) => addLine(group, type)} />
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function EmptyScript({ mode, onAdd }: { mode: EditorMode; onAdd: (type: BlockType) => void }) {
  return (
    <section className="grid min-h-[320px] place-items-center px-4 text-center">
      <div className="flex max-w-[420px] flex-col items-center">
        <span className="grid size-12 place-items-center rounded-xl border border-[#d7efd5] bg-[#f3faf2] text-[#39b536]">
          <FileText aria-hidden="true" className="size-6" strokeWidth={1.75} />
        </span>
        <h2 className="mb-0 mt-4 text-base font-bold leading-6 text-[#111827]">Tập này chưa có nội dung</h2>
        <p className="mb-0 mt-1.5 text-[13px] leading-[22px] text-[#4b5563]">
          {mode === 'edit' ? 'Bắt đầu bằng một cảnh mới, hoặc viết ngay dòng hành động đầu tiên.' : 'Chuyển sang Biên tập để bắt đầu viết.'}
        </p>
        {mode === 'edit' && (
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <button
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#39b536] px-5 text-[13px] font-medium text-white shadow-sm hover:bg-[#32a92f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#198c22]"
              onClick={() => onAdd('scene')}
              type="button"
            >
              <Plus aria-hidden="true" className="size-4" />
              Cảnh mới
            </button>
            <button
              className="min-h-10 rounded-lg border border-[#d1d5db] bg-white px-5 text-[13px] font-medium text-[#111827] hover:bg-gray-50"
              onClick={() => onAdd('action')}
              type="button"
            >
              Thêm hành động
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
