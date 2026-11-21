/*
 * Kéo thả chiều rộng cột Trợ lý đạo diễn ↔ cột kết quả (mục 5 Phân cảnh & mục 6 Khung hình dùng chung).
 * Cùng cách làm với thanh kéo của Sidebar: pointer capture, phím mũi tên, nhấp đúp về mặc định.
 * Chiều rộng lưu localStorage; khi khung hẹp lại thì tự co để cột kết quả luôn ≥ RESULT_MIN_WIDTH.
 */
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'

export const CHAT_MIN_WIDTH = 280
export const CHAT_MAX_WIDTH = 600
export const CHAT_DEFAULT_WIDTH = 380
/** Cột kết quả không nhỏ hơn mức này. */
export const RESULT_MIN_WIDTH = 400
const KEYBOARD_STEP = 16
const STORAGE_KEY = 'storytoscene.director-chat-width.v1'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function readStoredWidth() {
  try {
    const value = Number(window.localStorage.getItem(STORAGE_KEY))
    return Number.isFinite(value) && value > 0 ? clamp(value, CHAT_MIN_WIDTH, CHAT_MAX_WIDTH) : CHAT_DEFAULT_WIDTH
  } catch {
    return CHAT_DEFAULT_WIDTH
  }
}

function storeWidth(value: number) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Math.round(value)))
  } catch {
    /* chỉ mất ghi nhớ chiều rộng */
  }
}

/**
 * @param reservedWidth phần chiều rộng khác trong hàng (thanh công cụ dọc + thanh kéo), không thuộc 2 cột.
 */
export function useChatSplit(reservedWidth: number) {
  const containerRef = useRef<HTMLDivElement>(null)
  /** Chiều rộng người dùng chọn (đã lưu). */
  const [preferred, setPreferred] = useState(readStoredWidth)
  /** Bề rộng khung chứa – để giới hạn sao cho cột kết quả còn ≥ RESULT_MIN_WIDTH. */
  const [containerWidth, setContainerWidth] = useState<number | null>(null)
  const [resizing, setResizing] = useState(false)
  const drag = useRef<{ startX: number; startWidth: number; width: number } | null>(null)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  /** Mức tối đa thực tế lúc này (không vượt CHAT_MAX_WIDTH, chừa chỗ cho cột kết quả). */
  const maxWidth = containerWidth === null ? CHAT_MAX_WIDTH : clamp(containerWidth - reservedWidth - RESULT_MIN_WIDTH, CHAT_MIN_WIDTH, CHAT_MAX_WIDTH)
  const width = clamp(preferred, CHAT_MIN_WIDTH, maxWidth)

  function apply(next: number, persist: boolean) {
    const value = clamp(next, CHAT_MIN_WIDTH, maxWidth)
    setPreferred(value)
    if (persist) storeWidth(value)
    return value
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = { startX: event.clientX, startWidth: width, width }
    setResizing(true)
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current
    if (!state) return
    state.width = apply(state.startWidth + event.clientX - state.startX, false)
  }

  function onPointerEnd(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current
    if (!state) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    drag.current = null
    setResizing(false)
    storeWidth(state.width)
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? KEYBOARD_STEP * 4 : KEYBOARD_STEP
    const target =
      event.key === 'ArrowLeft' ? width - step : event.key === 'ArrowRight' ? width + step : event.key === 'Home' ? CHAT_MIN_WIDTH : event.key === 'End' ? maxWidth : null
    if (target === null) return
    event.preventDefault()
    apply(target, true)
  }

  // Trong lúc kéo: giữ con trỏ col-resize và chặn bôi đen chữ trên cả trang (kể cả khi chuột ra khỏi thanh kéo).
  // Thả chuột hoặc rời màn hình giữa chừng → trả lại như cũ.
  useEffect(() => {
    if (!resizing) return
    const { style } = document.body
    style.cursor = 'col-resize'
    style.userSelect = 'none'
    return () => {
      style.cursor = ''
      style.userSelect = ''
    }
  }, [resizing])

  return {
    containerRef,
    width,
    resizing,
    handleProps: {
      'aria-valuemin': CHAT_MIN_WIDTH,
      'aria-valuemax': maxWidth,
      'aria-valuenow': Math.round(width),
      onDoubleClick: () => apply(CHAT_DEFAULT_WIDTH, true),
      onKeyDown,
      onLostPointerCapture: onPointerEnd,
      onPointerCancel: onPointerEnd,
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
    },
  }
}
