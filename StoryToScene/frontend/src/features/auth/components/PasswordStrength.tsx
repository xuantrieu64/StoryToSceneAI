import { cn } from '@/lib/utils'

const levels = [
  { label: 'Rất yếu', text: 'text-rose-600' },
  { label: 'Yếu', text: 'text-rose-600' },
  { label: 'Trung bình', text: 'text-amber-600' },
  { label: 'Khá', text: 'text-jade-600' },
  { label: 'Mạnh', text: 'text-jade-700' },
]

/** Chấm điểm 0–4: đủ 10 ký tự, có chữ hoa + thường, có số, có ký tự đặc biệt. */
function scorePassword(pw: string) {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 10) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

/** Thanh 4 đoạn đánh giá độ mạnh mật khẩu (tính ngay trên trình duyệt, không gửi đi đâu). */
export function PasswordStrength({ password, id }: { password: string; id: string }) {
  const score = scorePassword(password)
  const level = levels[score]
  return (
    <div id={id} className="mt-2 flex items-center gap-3">
      <div aria-hidden="true" className="grid flex-1 grid-cols-4 gap-1.5">
        {[1, 2, 3, 4].map((n) => (
          <span
            key={n}
            className={cn(
              'h-1.5 rounded-full transition-colors',
              n <= score ? (score <= 1 ? 'bg-rose-400' : score === 2 ? 'bg-amber-400' : 'bg-jade-500') : 'bg-slate-200',
            )}
          />
        ))}
      </div>
      <p className="shrink-0 text-xs leading-4 text-slate-500" aria-live="polite">
        Mức độ mạnh: <span className={cn('font-semibold', password ? level.text : 'text-slate-400')}>{password ? level.label : '—'}</span>
      </p>
    </div>
  )
}
