import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

type OtpInputProps = {
  id: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  length?: number
  invalid?: boolean
  describedBy?: string
}

/**
 * Ô nhập mã xác minh gồm `length` ô một chữ số.
 * Tự chuyển ô khi gõ, Backspace lùi về ô trước, dán cả mã vào ô bất kỳ.
 */
export function OtpInput({ id, value, onChange, onBlur, length = 6, invalid, describedBy }: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')

  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus()

  const setDigit = (i: number, d: string) => {
    const next = digits.slice()
    next[i] = d
    onChange(next.join('').slice(0, length))
  }

  const handleInput = (i: number, raw: string) => {
    const nums = raw.replace(/\D/g, '')
    if (!nums) return setDigit(i, '')
    if (nums.length > 1) {
      // Gõ/dán nhiều số: điền lần lượt từ ô hiện tại
      const next = digits.slice()
      for (let k = 0; k < nums.length && i + k < length; k++) next[i + k] = nums[k]
      onChange(next.join(''))
      return focus(i + nums.length)
    }
    setDigit(i, nums)
    focus(i + 1)
  }

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault()
      setDigit(i - 1, '')
      focus(i - 1)
    } else if (e.key === 'ArrowLeft') focus(i - 1)
    else if (e.key === 'ArrowRight') focus(i + 1)
  }

  const handlePaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    handleInput(i, e.clipboardData.getData('text'))
  }

  return (
    <div role="group" aria-labelledby={`${id}-label`} aria-describedby={describedBy} className="grid w-full max-w-[20rem] min-w-0 grid-cols-6 gap-1.5 sm:gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          id={i === 0 ? id : undefined}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          aria-label={`Chữ số ${i + 1}`}
          aria-invalid={invalid || undefined}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          onBlur={onBlur}
          className={cn(
            'h-11 w-full min-w-0 rounded-lg border bg-white text-center text-lg font-semibold text-slate-900 tabular-nums transition-colors outline-none sm:h-12',
            'focus:border-jade-600 focus:ring-3 focus:ring-jade-500/20',
            invalid ? 'border-rose-400' : 'border-slate-200',
          )}
        />
      ))}
    </div>
  )
}
