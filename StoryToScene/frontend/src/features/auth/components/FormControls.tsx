import { forwardRef, type ComponentProps, type ReactNode } from 'react'
import { CircleAlert, Info, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ------------------------------- Ô nhập liệu ------------------------------- */

type TextFieldProps = ComponentProps<'input'> & {
  label: string
  error?: string
  /** Tùy chọn (dùng ở Login): icon trước nhãn */
  icon?: LucideIcon
  /** Tùy chọn: nội dung bên phải nhãn (vd. link "Quên mật khẩu?") */
  labelAside?: ReactNode
  /** Tùy chọn: phần tử nằm trong ô nhập, sát mép phải (vd. nút hiện/ẩn mật khẩu) */
  endAdornment?: ReactNode
  /** `lg`: ô cao 48px, bo góc lớn hơn (Login) */
  inputSize?: 'md' | 'lg'
  /** Tùy chọn (dùng ở Register): icon nằm trong ô nhập, sát mép trái */
  leadingIcon?: LucideIcon
  /** Tùy chọn: hiện dấu * đỏ sau nhãn cho trường bắt buộc */
  requiredMark?: boolean
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, id, className, icon: Icon, labelAside, endAdornment, inputSize = 'md', leadingIcon: LeadingIcon, requiredMark = false, ...props },
  ref,
) {
  const errorId = error ? `${id}-error` : undefined
  const labelEl = (
    <label
      htmlFor={id}
      className={cn(
        'block text-xs leading-4 font-medium text-slate-700',
        !labelAside && 'mb-1.5',
        Icon && 'flex items-center gap-2 text-sm leading-5 font-semibold text-slate-800',
      )}
    >
      {Icon && <Icon aria-hidden="true" className="size-4 text-slate-600" />}
      {label}
      {requiredMark && (
        <span aria-hidden="true" className="ml-0.5 text-rose-500">
          *
        </span>
      )}
    </label>
  )
  const input = (
    <input
      ref={ref}
      id={id}
      aria-invalid={error ? true : undefined}
      aria-describedby={errorId}
      className={cn(
        'h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 transition-colors outline-none placeholder:text-slate-400',
        'focus:border-jade-500 focus:ring-3 focus:ring-jade-500/15',
        error ? 'border-rose-400' : 'border-[#dfe5dc] hover:border-[#cfd8cb]',
        inputSize === 'lg' && 'h-12 rounded-xl px-4 text-[15px]',
        endAdornment && 'pr-12',
        LeadingIcon && 'pl-11',
      )}
      {...props}
    />
  )
  const field = LeadingIcon ? (
    <div className="relative">
      <LeadingIcon aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-slate-500" />
      {input}
    </div>
  ) : (
    input
  )

  return (
    <div className={className}>
      {labelAside ? (
        <div className="mb-1.5 flex items-center justify-between gap-3">
          {labelEl}
          {labelAside}
        </div>
      ) : (
        labelEl
      )}
      {endAdornment ? (
        <div className="relative">
          {field}
          <div className="absolute inset-y-0 right-1.5 flex items-center">{endAdornment}</div>
        </div>
      ) : (
        field
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-xs leading-4 text-rose-600">
          {error}
        </p>
      )}
    </div>
  )
})

/* ------------------------------- Nút chính ------------------------------- */

export function PrimaryButton({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      className={cn(
        'inline-flex h-11 w-full items-center justify-center rounded-lg bg-jade-500 px-4 text-sm leading-5 font-semibold text-white shadow-xs transition-colors hover:bg-jade-600 focus-visible:ring-3 focus-visible:ring-jade-500/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    />
  )
}

/* --------------------------- Nút Google (OAuth) --------------------------- */

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  )
}

export function GoogleButton({ children, className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-[#dfe5dc] bg-white px-4 text-sm leading-5 font-medium text-slate-800 transition-colors hover:bg-slate-50 focus-visible:ring-3 focus-visible:ring-jade-500/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white',
        className,
      )}
      {...props}
    >
      <GoogleMark />
      {children}
    </button>
  )
}

/* -------------------------------- Đường kẻ -------------------------------- */

export function OrDivider({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center gap-3" role="separator" aria-label={label}>
      <span className="h-px flex-1 bg-[#e5ebe2]" />
      <span className="text-[11px] leading-4 tracking-[0.04em] text-slate-400">{label}</span>
      <span className="h-px flex-1 bg-[#e5ebe2]" />
    </div>
  )
}

/* ------------------------------- Thông báo ------------------------------- */

/** Thông báo trạng thái (vd. chưa kết nối máy chủ). Dùng role="status" để screen reader đọc. */
export function FormNotice({ tone = 'info', children }: { tone?: 'info' | 'error'; children: ReactNode }) {
  const Icon = tone === 'error' ? CircleAlert : Info
  return (
    <p
      role="status"
      className={cn(
        'mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs leading-5',
        tone === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-jade-50 text-jade-700',
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  )
}
