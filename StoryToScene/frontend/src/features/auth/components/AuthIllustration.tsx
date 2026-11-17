import { ArrowRight, Clapperboard, FileText, FolderOpen, LayoutTemplate, Library, Play, Sparkles, Video, type LucideIcon } from 'lucide-react'
import { LogoMark } from '@/features/home/components/shared/Logo'

/** Khung hình phong cảnh hoàng hôn (vẽ bằng SVG, không cần ảnh). */
function SunsetScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b7fb4" />
          <stop offset="0.45" stopColor="#e7a46d" />
          <stop offset="0.75" stopColor="#f6c178" />
        </linearGradient>
        <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff6d6" />
          <stop offset="0.5" stopColor="#ffd88a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffd88a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="180" fill="url(#sky)" />
      <circle cx="226" cy="98" r="46" fill="url(#sun)" />
      <path d="M0 118 L46 70 L82 104 L128 52 L176 108 L214 78 L262 112 L300 84 L320 98 V180 H0Z" fill="#6c6f9c" opacity="0.75" />
      <path d="M0 132 L58 96 L104 126 L150 90 L198 128 L246 102 L290 130 L320 116 V180 H0Z" fill="#45507a" />
      <path d="M0 150 L40 128 L92 146 L140 124 L196 150 L250 132 L320 150 V180 H0Z" fill="#2f3b52" />
      {/* Hàng cây phía trước */}
      {Array.from({ length: 14 }, (_, i) => {
        const x = 8 + i * 23 + (i % 3) * 4
        const h = 22 + (i % 4) * 7
        return <path key={i} d={`M${x} 180 L${x + 8} ${180 - h} L${x + 16} 180Z`} fill="#1d2a2c" />
      })}
    </svg>
  )
}

const sidebar = [
  { label: 'Tạo video', icon: Video, active: true },
  { label: 'Dự án của tôi', icon: FolderOpen },
  { label: 'Mẫu video', icon: LayoutTemplate },
  { label: 'Thư viện AI', icon: Library },
]

/**
 * Minh họa sản phẩm (trang trí): cửa sổ ứng dụng nghiêng, thẻ nội dung ở dưới,
 * nhãn AI và biểu tượng clapperboard – dựng bằng HTML/SVG theo ảnh thiết kế.
 * Login: thẻ "Câu chuyện của bạn..." · Register: thẻ "Từ ý tưởng đến video chỉ với AI".
 */
export function AuthIllustration({
  storyTitle = 'Câu chuyện của bạn...',
  storyIcon: StoryIcon = FileText,
  multilineTitle = false,
}: {
  storyTitle?: string
  storyIcon?: LucideIcon
  /** Cho phép tiêu đề thẻ xuống 2 dòng (Register) thay vì cắt bằng "…" (Login). */
  multilineTitle?: boolean
}) {
  return (
    <figure aria-label="Minh họa: biến câu chuyện thành video bằng AI" className="relative mx-auto aspect-[1.05] w-full max-w-[540px]">
      {/* Mảng xanh mint phía sau */}
      <div aria-hidden="true" className="absolute inset-[6%_4%_8%_10%] rounded-[45%] bg-[radial-gradient(circle_at_60%_45%,#c9f1de_0%,#e2f7ec_45%,transparent_72%)]" />
      <div aria-hidden="true" className="absolute top-[14%] right-[2%] size-[46%] rounded-full border border-jade-100/80" />

      {/* Cửa sổ ứng dụng */}
      <div
        aria-hidden="true"
        className="absolute top-[14%] left-[12%] w-[80%] rounded-2xl border border-white bg-white/95 p-2.5 shadow-[0_30px_60px_-25px_rgb(3_108_69/0.45)] [transform:perspective(1400px)_rotateY(-14deg)_rotateZ(7deg)]"
      >
        <div className="flex items-center gap-2 px-1.5 pb-2">
          <span className="text-[10px] font-bold text-rose-400">‹•</span>
          <LogoMark className="size-4 rounded [&_svg]:size-2.5" />
          <span className="text-[10px] font-bold text-slate-700">StoryToScene</span>
        </div>
        <div className="flex gap-2.5">
          <ul className="flex w-[30%] min-w-0 flex-col gap-1.5 overflow-hidden border-r border-slate-100 pr-2">
            {sidebar.map(({ label, icon: Icon, active }) => (
              <li
                key={label}
                className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[8.5px] leading-3 font-medium whitespace-nowrap ${active ? 'bg-jade-500 text-white' : 'text-slate-600'}`}
              >
                <Icon className="size-2.5 shrink-0" />
                {label}
              </li>
            ))}
          </ul>
          <div className="flex-1">
            <div className="relative overflow-hidden rounded-lg">
              <SunsetScene className="block aspect-[16/10] w-full" />
              <span className="absolute top-1/2 left-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-slate-900/70 text-white">
                <Play className="ml-0.5 size-3.5 fill-current" />
              </span>
              <span className="absolute right-1.5 bottom-1 text-[7px] text-white/90 tabular-nums">0:00 / 1:24</span>
            </div>
            <div className="mt-2 flex gap-1">
              {['#f0b778', '#e59a64', '#d98b5f', '#c97a58', '#e5e7eb', '#e5e7eb'].map((c, i) => (
                <span key={i} className="h-4 flex-1 rounded-[3px]" style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Nhãn AI */}
      <span
        aria-hidden="true"
        className="absolute top-[4%] right-[10%] flex items-center gap-1.5 rounded-full bg-linear-to-br from-jade-500 to-jade-700 px-4 py-2.5 text-lg font-bold text-white shadow-[0_14px_30px_-12px_rgb(3_108_69/0.7)]"
      >
        <Sparkles className="size-5" />
        AI
      </span>

      {/* Clapperboard */}
      <span
        aria-hidden="true"
        className="absolute bottom-[24%] left-[2%] flex size-[18%] -rotate-12 items-center justify-center rounded-2xl bg-linear-to-br from-jade-500 to-jade-700 text-white shadow-[0_14px_30px_-12px_rgb(3_108_69/0.7)]"
      >
        <Clapperboard className="size-1/2" strokeWidth={1.75} />
      </span>

      {/* Thẻ "Câu chuyện của bạn" */}
      <div
        aria-hidden="true"
        className="absolute bottom-[4%] left-[22%] w-[52%] rotate-[4deg] rounded-2xl border border-white bg-white p-3.5 shadow-[0_24px_40px_-20px_rgb(15_23_42/0.35)]"
      >
        <div className="flex items-center gap-2">
          <StoryIcon className={multilineTitle ? 'size-5 shrink-0 text-jade-600' : 'size-5 text-jade-600'} />
          <span className={multilineTitle ? 'text-xs leading-4 font-semibold text-slate-700' : 'truncate text-xs font-semibold text-slate-700'}>{storyTitle}</span>
        </div>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <span className="h-1.5 w-full rounded-full bg-slate-100" />
            <span className="h-1.5 w-4/5 rounded-full bg-slate-100" />
            <span className="h-1.5 w-3/5 rounded-full bg-slate-100" />
          </div>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-jade-700 text-white">
            <ArrowRight className="size-3.5" />
          </span>
        </div>
      </div>

      {/* Mũi tên cong nối thẻ truyện → video */}
      <svg aria-hidden="true" viewBox="0 0 80 60" className="absolute right-[10%] bottom-[12%] w-[13%] text-jade-600">
        <path d="M4 54 C 30 54, 56 40, 70 10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M58 14 L71 6 L74 22" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </figure>
  )
}
