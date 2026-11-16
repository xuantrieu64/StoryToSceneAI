import { cn } from '@/lib/utils'
import { heroPosterColumns } from '../data/home-content'
import { ImageOverlayCard } from './shared/ImageOverlayCard'

/**
 * Mosaic 3 cột poster trong khung trắng (716px @ desktop). Cột giữa lệch lên
 * 16px. Chiều cao tile giữ đúng tỉ lệ Figma và co giãn qua biến `--m`.
 */
export function PosterMosaic({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative flex items-start justify-center gap-2 rounded-2xl bg-white p-1.5 shadow-xl sm:gap-3.5 sm:p-2',
        '[--m:0.55] sm:[--m:0.8] lg:[--m:0.85] xl:[--m:1]',
        className,
      )}
    >
      {heroPosterColumns.map((column, colIndex) => (
        <div
          key={colIndex}
          className={cn(
            'flex min-w-0 flex-1 flex-col gap-2 sm:gap-3.5',
            colIndex === 0 && 'pb-4',
            colIndex === 1 && '-mt-4',
            colIndex === 2 && 'py-2',
          )}
        >
          {column.map((tile) => (
            <ImageOverlayCard
              key={tile.title}
              variant="poster"
              title={tile.title}
              src={tile.src}
              strongShade={tile.strongShade}
              loading="eager"
              className="w-full"
              style={{ height: `calc(${tile.height}px * var(--m))` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
