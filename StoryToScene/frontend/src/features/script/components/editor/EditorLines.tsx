import type { KeyboardEvent, ReactNode } from 'react'
import { ChevronsRight, MessageSquareText, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BLOCK_LABELS, splitParenthetical, type BlockType, type ScriptBlock } from '../../lib/script-blocks'
import { BlockTypeMenu } from './BlockTypeMenu'
import { LineEditor, type CommitIntent, type LineDraft } from './LineEditor'

/** Cột nhãn + cột nội dung; trên màn hình hẹp nhãn nằm trên nội dung. */
const LINE_GRID = 'grid grid-cols-[96px_minmax(0,1fr)] items-start gap-x-4 max-[560px]:grid-cols-1 max-[560px]:gap-y-1'

export type LineHandlers = {
  onStartEdit: () => void
  onCommit: (draft: LineDraft, intent: CommitIntent) => boolean
  onDeleteEmpty: () => void
  onDraftChange: (draft: LineDraft) => void
  onChangeType: (type: BlockType) => void
  onDelete: () => void
}

/** Vùng chữ bấm được để bắt đầu sửa (Enter/Space cũng mở sửa). */
function EditTarget({ label, onStartEdit, children, className }: { label: string; onStartEdit: () => void; children: ReactNode; className?: string }) {
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onStartEdit()
    }
  }
  return (
    <div
      aria-label={label}
      className={cn('-mx-2 cursor-text rounded-md px-2 py-0.5 outline-none transition-colors hover:bg-[#f3f4f6] focus-visible:ring-2 focus-visible:ring-[#39b536]/40', className)}
      onClick={onStartEdit}
      onKeyDown={onKeyDown}
      role="button"
      tabIndex={0}
    >
      {children}
    </div>
  )
}

const Placeholder = ({ children }: { children: ReactNode }) => <span className="text-[#9ca3af]">{children}</span>

/* ------------------------------------ Cảnh ------------------------------------ */

type SceneHeadingProps = LineHandlers & {
  block: ScriptBlock
  number: number
  editing: boolean
  actionCount: number
  dialogueCount: number
}

export function SceneHeading({ block, number, editing, actionCount, dialogueCount, ...handlers }: SceneHeadingProps) {
  return (
    <div className={cn(LINE_GRID, 'border-b border-[#eef0f3] pb-2.5')}>
      <div className="pt-[3px]">
        <BlockTypeMenu onChangeType={handlers.onChangeType} onDelete={handlers.onDelete} type="scene" />
      </div>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-1 text-[15px] font-semibold leading-7 text-[#111827]">
          <span className="shrink-0 py-0.5">Cảnh {number}.</span>
          {editing ? (
            <div className="min-w-0 flex-1 py-0.5">
              <LineEditor
                block={block}
                onCommit={handlers.onCommit}
                onDeleteEmpty={handlers.onDeleteEmpty}
                onDraftChange={handlers.onDraftChange}
                placeholder="Bối cảnh · Thời gian (vd. Tiệm sách cũ · Đêm mưa)"
                textClassName="text-[15px] font-semibold leading-7 text-[#111827]"
              />
            </div>
          ) : (
            <EditTarget className="min-w-0 flex-1" label={`Sửa bối cảnh cảnh ${number}`} onStartEdit={handlers.onStartEdit}>
              {block.text || <Placeholder>Bối cảnh · Thời gian</Placeholder>}
            </EditTarget>
          )}
        </div>
        <span className="shrink-0 whitespace-nowrap pt-1.5 text-xs text-[#9ca3af] max-[560px]:hidden">
          {actionCount} hành động · {dialogueCount} thoại
        </span>
      </div>
    </div>
  )
}

/* ------------------------- Hành động · Thoại · Chuyển cảnh ------------------------- */

type ScriptLineProps = LineHandlers & {
  block: ScriptBlock
  editing: boolean
  /** Nhân vật xuất hiện đầu tiên được nhấn màu xanh, các nhân vật khác màu xám. */
  speakerTone: 'primary' | 'muted'
}

const BODY_TEXT = 'text-[15px] leading-7 text-[#1f2937]'

export function ScriptLine({ block, editing, speakerTone, ...handlers }: ScriptLineProps) {
  const isDialogue = block.type === 'dialogue'
  const isTransition = block.type === 'transition'
  const accent = speakerTone === 'primary' ? 'border-[#39b536]' : 'border-[#d1d5db]'

  let body: ReactNode
  if (editing) {
    const editor = (
      <LineEditor
        block={block}
        onCommit={handlers.onCommit}
        onDeleteEmpty={handlers.onDeleteEmpty}
        onDraftChange={handlers.onDraftChange}
        placeholder={isDialogue ? '(cảm xúc) Lời thoại' : isTransition ? 'Vd. CẮT SANG:' : 'Mô tả hành động, bối cảnh…'}
        textClassName={cn(BODY_TEXT, isTransition && 'text-right text-[13px] font-semibold uppercase tracking-[0.6px] text-[#4b5563]')}
      />
    )
    body = isDialogue ? <div className={cn('border-l-2 py-0.5 pl-3.5', accent)}>{editor}</div> : <div className="py-0.5">{editor}</div>
  } else if (isDialogue) {
    const { note, line } = splitParenthetical(block.text)
    body = (
      <EditTarget className={cn('rounded-l-none border-l-2 pl-3.5', accent)} label={`Sửa thoại của ${block.character || 'nhân vật'}`} onStartEdit={handlers.onStartEdit}>
        <span className={cn('block text-[13px] font-semibold leading-5', speakerTone === 'primary' ? 'text-[#39b536]' : 'text-[#111827]')}>
          {block.character || <Placeholder>Tên nhân vật</Placeholder>}
        </span>
        <span className={cn('block whitespace-pre-wrap', BODY_TEXT)}>
          {note && <em className="mr-1 text-[#6b7280]">({note})</em>}
          {line || <Placeholder>Lời thoại</Placeholder>}
        </span>
      </EditTarget>
    )
  } else if (isTransition) {
    body = (
      <EditTarget className="text-right" label="Sửa chuyển cảnh" onStartEdit={handlers.onStartEdit}>
        <span className="text-[13px] font-semibold uppercase leading-7 tracking-[0.6px] text-[#4b5563]">{block.text || <Placeholder>Chuyển cảnh</Placeholder>}</span>
      </EditTarget>
    )
  } else {
    body = (
      <EditTarget label="Sửa hành động" onStartEdit={handlers.onStartEdit}>
        <span className={cn('block whitespace-pre-wrap', BODY_TEXT)}>{block.text || <Placeholder>Mô tả hành động</Placeholder>}</span>
      </EditTarget>
    )
  }

  return (
    <div className={LINE_GRID}>
      <div className={isDialogue ? 'pt-1' : 'pt-[3px]'}>
        <BlockTypeMenu className="w-full max-w-[96px] max-[560px]:w-auto" onChangeType={handlers.onChangeType} onDelete={handlers.onDelete} type={block.type} />
      </div>
      <div className="min-w-0">{body}</div>
    </div>
  )
}

/* ---------------------------------- Thanh thêm dòng ---------------------------------- */

const ADD_OPTIONS: { type: BlockType; icon: typeof Plus }[] = [
  { type: 'action', icon: Plus },
  { type: 'dialogue', icon: MessageSquareText },
  { type: 'transition', icon: ChevronsRight },
]

export function AddLineBar({ onAdd }: { onAdd: (type: BlockType) => void }) {
  return (
    <div className={cn(LINE_GRID, 'pt-1')}>
      <span className="pt-1.5 text-right text-xs text-[#9ca3af] max-[560px]:text-left">Thêm dòng:</span>
      <div className="flex flex-wrap gap-2">
        {ADD_OPTIONS.map(({ type, icon: Icon }) => (
          <button
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#f3f4f6] px-3 text-[13px] font-medium text-[#374151] transition-colors hover:bg-[#e5e7eb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]"
            key={type}
            onClick={() => onAdd(type)}
            type="button"
          >
            <Icon aria-hidden="true" className="size-3.5 text-[#39b536]" strokeWidth={2.2} />
            {BLOCK_LABELS[type]}
          </button>
        ))}
        <button
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#39b536] bg-white px-3 text-[13px] font-medium text-[#39b536] transition-colors hover:bg-[#f3faf2] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]"
          onClick={() => onAdd('scene')}
          type="button"
        >
          <Plus aria-hidden="true" className="size-3.5" strokeWidth={2.2} />
          Cảnh mới
        </button>
      </div>
    </div>
  )
}
