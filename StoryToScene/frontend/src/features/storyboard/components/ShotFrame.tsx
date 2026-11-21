import { cn } from '@/lib/utils'
import { frameStatus } from '../lib/frames'
import type { Shot, ShotSize } from '../lib/storyboard-storage'

type ShotFrameProps = {
  shot: Shot
  /** Bối cảnh của cảnh (đêm / mưa… → tông màu khung minh họa). */
  heading: string
  className?: string
}

/** Tỉ lệ + vị trí nhân vật theo cỡ cảnh (khung 160×90). */
const FIGURE: Record<ShotSize, { scale: number; baseY: number; horizon: number; buildings: boolean }> = {
  'Viễn cảnh': { scale: 0.22, baseY: 74, horizon: 62, buildings: true },
  'Toàn cảnh': { scale: 0.42, baseY: 80, horizon: 58, buildings: true },
  'Trung cảnh': { scale: 0.95, baseY: 104, horizon: 52, buildings: false },
  'Cận cảnh': { scale: 1.7, baseY: 140, horizon: 48, buildings: false },
  'Đặc tả': { scale: 3, baseY: 190, horizon: 44, buildings: false },
}

/**
 * Vùng hình của cú máy (dùng chung cho Storyboard, Timeline, Khung hình), theo thứ tự ưu tiên:
 *   1. ảnh người dùng tải lên;
 *   2. khung hình AI đã tạo xong ở bước Khung hình (mô phỏng: cùng bố cục nhưng có ánh sáng,
 *      chiều sâu, biến thể theo `seed`);
 *   3. khung minh họa tạm theo cỡ cảnh, số nhân vật và không khí bối cảnh (đêm, mưa…).
 */
export function ShotFrame({ shot, heading, className }: ShotFrameProps) {
  if (shot.image) {
    return <img alt={`Khung hình cú máy ${shot.number}`} className={cn('aspect-video w-full rounded-lg object-cover', className)} src={shot.image} />
  }

  const mood = heading.toLocaleLowerCase('vi')
  const night = /đêm|tối|khuya/u.test(mood)
  const rain = mood.includes('mưa')
  const figure = FIGURE[shot.size]
  const people = Math.min(shot.characters.length, 2)
  const palette = night
    ? { top: '#1e293b', bottom: '#334155', ground: '#0f172a', building: '#273449', window: '#facc15', person: '#64748b' }
    : { top: '#f1f8f0', bottom: '#d9eed7', ground: '#c3e1c0', building: '#b5d6b2', window: '#ffffff', person: '#6b8f69' }
  const rendered = frameStatus(shot) === 'ready' && shot.frame ? shot.frame : null
  const seed = rendered?.seed ?? 0
  const gradientId = `shot-sky-${shot.id}`
  const lightId = `shot-light-${shot.id}`
  const vignetteId = `shot-vignette-${shot.id}`
  const lightX = 30 + (seed % 100)
  const label = rendered ? `Ảnh AI · ${rendered.tier === 'premium' ? 'Cao cấp' : 'Thường'}` : 'Minh họa tạm'

  return (
    <div className={cn('relative overflow-hidden rounded-lg', className)}>
      <svg aria-label={`${label}: ${shot.size}`} className="block aspect-video w-full" role="img" viewBox="0 0 160 90">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={palette.top} />
            <stop offset="1" stopColor={palette.bottom} />
          </linearGradient>
          <radialGradient cx={lightX / 160} cy="0.35" id={lightId} r="0.55">
            <stop offset="0" stopColor={night ? '#fde68a' : '#ffffff'} stopOpacity={night ? 0.55 : 0.7} />
            <stop offset="1" stopColor={night ? '#fde68a' : '#ffffff'} stopOpacity="0" />
          </radialGradient>
          <radialGradient cx="0.5" cy="0.5" id={vignetteId} r="0.75">
            <stop offset="0.6" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity={night ? 0.55 : 0.25} />
          </radialGradient>
        </defs>
        <rect fill={`url(#${gradientId})`} height="90" width="160" />
        {rendered && <rect fill={`url(#${lightId})`} height="90" width="160" />}

        {figure.buildings && (
          <g fill={palette.building}>
            <rect height="34" width="26" x="6" y={figure.horizon - 34} />
            <rect height="46" width="22" x="34" y={figure.horizon - 46} />
            <rect height="28" width="30" x="112" y={figure.horizon - 28} />
            <rect height="40" width="16" x="142" y={figure.horizon - 40} />
            <g fill={palette.window} opacity={night ? 0.8 : 0.6}>
              <rect height="4" width="4" x="12" y={figure.horizon - 26} />
              <rect height="4" width="4" x="40" y={figure.horizon - 36} />
              <rect height="4" width="4" x="48" y={figure.horizon - 24} />
              <rect height="4" width="4" x="120" y={figure.horizon - 20} />
            </g>
          </g>
        )}
        <rect fill={palette.ground} height={90 - figure.horizon} opacity="0.7" width="160" y={figure.horizon} />

        {Array.from({ length: people }, (_, index) => {
          const x = people === 1 ? 80 : index === 0 ? 58 : 104
          return (
            <g
              fill={palette.person}
              key={index}
              stroke={rendered ? (night ? '#fcd34d' : '#ffffff') : 'none'}
              strokeOpacity={rendered?.tier === 'premium' ? 0.7 : 0.4}
              strokeWidth={rendered ? 1.2 / figure.scale : 0}
              transform={`translate(${x + (rendered ? (seed % 7) - 3 : 0)} ${figure.baseY}) scale(${figure.scale})`}
            >
              <circle cx="0" cy="-58" r="11" />
              <path d="M-20 0 C-20 -30 -14 -42 0 -42 C14 -42 20 -30 20 0 Z" />
            </g>
          )
        })}

        {rain && (
          <g opacity="0.35" stroke={night ? '#cbd5e1' : '#64748b'} strokeLinecap="round" strokeWidth="0.6">
            {Array.from({ length: 22 }, (_, index) => {
              const x = (index * 37 + shot.number * 11) % 168
              const y = (index * 23) % 80
              return <line key={index} x1={x} x2={x - 3} y1={y} y2={y + 9} />
            })}
          </g>
        )}
        {rendered && <rect fill={`url(#${vignetteId})`} height="90" width="160" />}
      </svg>
      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/45 px-1.5 py-0.5 text-[10px] font-medium text-white">{label}</span>
    </div>
  )
}
