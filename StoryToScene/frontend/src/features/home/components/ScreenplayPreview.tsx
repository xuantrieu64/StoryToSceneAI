import { Fragment } from 'react'
import { Focus } from 'lucide-react'
import { demoScreenplay as sp } from '../data/home-content'

/**
 * Nội dung kịch bản ở BƯỚC 3 – phong cách "Modern Screenplay Editor".
 * Toàn bộ dùng font sans-serif của trang (Be Vietnam Pro, đủ tiếng Việt),
 * phân biệt các khối bằng màu nền, nhãn và căn lề thay vì font monospace.
 */
export function ScreenplayPreview() {
  const [sceneNumber, ...sceneParts] = sp.sceneHeading

  return (
    <div lang="vi" className="flex flex-col gap-4 break-words">
      {/* Tiêu đề cảnh */}
      <p
        aria-label={sp.sceneHeading.join(', ')}
        className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-lg bg-surface px-3 py-2.5 text-xs leading-5 font-bold tracking-[0.06em] text-ink uppercase"
      >
        <span className="text-brand-deep">{sceneNumber}</span>
        {sceneParts.map((part) => (
          <Fragment key={part}>
            <span aria-hidden="true" className="text-ink-muted/50">
              ·
            </span>
            <span>{part}</span>
          </Fragment>
        ))}
      </p>

      {/* Mô tả cảnh */}
      <p className="text-sm leading-6 text-ink-muted">{sp.action}</p>

      {/* Cận cảnh */}
      <div className="rounded-lg border-l-2 border-brand bg-page px-3.5 py-3">
        <span className="mb-1.5 inline-flex items-center gap-1 rounded-sm bg-brand-tint px-1.5 py-0.5 text-[11px] leading-4 font-semibold tracking-[0.08em] text-brand-deep uppercase">
          <Focus aria-hidden="true" className="size-3" strokeWidth={2.5} />
          {sp.shotLabel.replace(/:$/, '')}
        </span>
        <p className="text-[13px] leading-[22px] text-ink-muted italic">{sp.insert}</p>
      </div>

      {/* Lời thoại */}
      <figure className="rounded-xl border border-line bg-white px-4 py-3.5 text-center shadow-xs">
        <figcaption>
          <span className="block text-[13px] leading-5 font-bold tracking-[0.08em] text-ink uppercase">
            {sp.character}
          </span>
          <span className="block text-xs leading-5 text-ink-muted italic">{sp.parenthetical}</span>
        </figcaption>
        <blockquote className="mt-1.5 text-[15px] leading-6 font-medium text-ink text-balance">
          {sp.dialogue}
        </blockquote>
      </figure>

      {/* Hành động kết cảnh */}
      <p className="text-sm leading-6 text-ink-muted">{sp.closingAction}</p>
    </div>
  )
}
