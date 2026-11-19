import { useRef, useState, type FocusEvent, type KeyboardEvent } from 'react'
import type { ScriptBlock } from '../../lib/script-blocks'
import { AutoTextarea } from './AutoTextarea'

export type LineDraft = { text: string; character?: string }
/** next = Enter (lưu & thêm dòng mới) · exit = Esc / bấm ra ngoài (lưu & thôi sửa). */
export type CommitIntent = 'next' | 'exit'

type LineEditorProps = {
  block: ScriptBlock
  /** Trả về false nếu không lưu được (vd. vượt giới hạn ký tự) → giữ ô đang sửa. */
  onCommit: (draft: LineDraft, intent: CommitIntent) => boolean
  /** Backspace khi dòng đã trống → xóa dòng, sửa dòng phía trên. */
  onDeleteEmpty: () => void
  /** Báo nội dung đang gõ (để bộ đếm ký tự cập nhật theo thời gian thực). */
  onDraftChange?: (draft: LineDraft) => void
  textClassName: string
  placeholder: string
}

/** Ô sửa trực tiếp một dòng. Enter: thêm dòng · Shift+Enter: xuống dòng · Esc: xong. */
export function LineEditor({ block, onCommit, onDeleteEmpty, onDraftChange, textClassName, placeholder }: LineEditorProps) {
  const [text, setTextState] = useState(block.text)
  const [character, setCharacterState] = useState(block.character ?? '')
  const setText = (value: string) => {
    setTextState(value)
    onDraftChange?.({ text: value, character })
  }
  const setCharacter = (value: string) => {
    setCharacterState(value)
    onDraftChange?.({ text, character: value })
  }
  const done = useRef(false)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const isDialogue = block.type === 'dialogue'

  function commit(intent: CommitIntent) {
    if (done.current) return
    const draft = isDialogue ? { text, character } : { text }
    done.current = onCommit(draft, intent)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>, field: 'character' | 'text') {
    if (event.nativeEvent.isComposing) return
    if (event.key === 'Escape') {
      event.preventDefault()
      commit('exit')
    } else if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      // Tên nhân vật → Enter chuyển sang ô lời thoại
      if (field === 'character') textRef.current?.focus()
      else commit('next')
    } else if (event.key === 'Backspace' && !text && !character) {
      event.preventDefault()
      done.current = true
      onDeleteEmpty()
    }
  }

  // Chỉ lưu khi focus rời hẳn khỏi dòng (chuyển giữa ô tên ↔ lời thoại thì không)
  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) commit('exit')
  }

  return (
    <div className="min-w-0" onBlur={handleBlur}>
      {isDialogue && (
        <input
          aria-label="Tên nhân vật"
          // Chưa có tên → bắt đầu từ ô tên; đã có tên → vào thẳng lời thoại
          autoFocus={!block.character}
          className="mb-0.5 block w-full border-0 bg-transparent p-0 text-[13px] font-semibold leading-5 text-[#111827] outline-none placeholder:font-normal placeholder:text-[#9ca3af]"
          maxLength={40}
          onChange={(event) => setCharacter(event.target.value)}
          onKeyDown={(event) => handleKeyDown(event, 'character')}
          placeholder="Tên nhân vật"
          value={character}
        />
      )}
      <AutoTextarea
        aria-label={placeholder}
        autoFocus={!isDialogue || Boolean(block.character)}
        className={textClassName}
        onChange={(event) => setText(event.target.value)}
        onFocus={(event) => {
          const end = event.currentTarget.value.length
          event.currentTarget.setSelectionRange(end, end)
        }}
        onKeyDown={(event) => handleKeyDown(event, 'text')}
        placeholder={placeholder}
        ref={textRef}
        value={text}
      />
    </div>
  )
}
