import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

type ImageOverlayCardProps = {
  src: string
  /** Tên hiển thị (dùng làm alt) */
  title: string
  description?: string
  /** `poster` = tile mosaic hero (nhãn 12px), `genre` = thẻ thể loại (tiêu đề serif + mô tả) */
  variant?: 'poster' | 'genre'
  /** Đậm hơn cho ảnh có nền sáng (Figma dùng 0.6 / 0.7) */
  strongShade?: boolean
  loading?: 'eager' | 'lazy'
  className?: string
  style?: CSSProperties
}

/** Ảnh crop `object-cover` + gradient đen từ dưới lên + chữ trắng. */
export function ImageOverlayCard({
  src,
  title,
  description,
  variant = 'genre',
  strongShade,
  loading = 'lazy',
  className,
  style,
}: ImageOverlayCardProps) {
  const isGenre = variant === 'genre'

  return (
    <figure
      className={cn('group relative overflow-hidden rounded-xl bg-surface shadow-xs', className)}
      style={style}
    >
      <img
        src={src}
        alt={title}
        width={512}
        height={279}
        loading={loading}
        decoding="async"
        className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transition-none"
      />
      <div
        aria-hidden="true"
        className={cn(
          'absolute inset-0 bg-linear-to-t to-transparent',
          isGenre
            ? 'from-black/85 via-black/20 via-50%'
            : cn(strongShade ? 'from-black/70' : 'from-black/60', 'via-transparent via-50%'),
        )}
      />
      <figcaption
        className={cn('absolute', isGenre ? 'inset-x-3 bottom-3' : 'inset-x-2.5 bottom-2.5')}
      >
        {isGenre ? (
          <>
            <h3 className="text-lg leading-6 font-semibold text-white sm:text-xl sm:leading-7">
              {title}
            </h3>
            {description && (
              <p className="truncate text-[13px] leading-5 text-white/80">{description}</p>
            )}
          </>
        ) : (
          <span className="text-xs leading-4 font-semibold tracking-[0.04em] text-white">{title}</span>
        )}
      </figcaption>
    </figure>
  )
}
