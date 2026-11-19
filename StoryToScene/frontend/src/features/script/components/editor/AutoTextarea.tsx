import { useLayoutEffect, useRef, type Ref, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type AutoTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string; ref?: Ref<HTMLTextAreaElement> }

/** Ô nhập nhiều dòng tự cao theo nội dung – trông như dòng chữ đang hiển thị. */
export function AutoTextarea({ className, value, ref, ...props }: AutoTextareaProps) {
  const inner = useRef<HTMLTextAreaElement | null>(null)

  useLayoutEffect(() => {
    const el = inner.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  // Gộp ref nội bộ (đo chiều cao) với ref của component cha
  function setRefs(el: HTMLTextAreaElement | null) {
    inner.current = el
    if (typeof ref === 'function') ref(el)
    else if (ref) ref.current = el
  }

  return (
    <textarea
      {...props}
      className={cn('block w-full resize-none overflow-hidden border-0 bg-transparent p-0 outline-none placeholder:text-[#9ca3af]', className)}
      ref={setRefs}
      rows={1}
      value={value}
    />
  )
}
