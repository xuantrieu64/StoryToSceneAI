import type { CharacterVersion } from '@/features/characters/lib/character-storage'
import { cn } from '@/lib/utils'

type CharacterSampleImageProps = {
  /** null = chưa có ảnh mẫu → chữ cái đầu của tên. */
  sample: CharacterVersion | null
  name: string
  className?: string
  /** Hiện nhãn "Ảnh mẫu · Thường/Cao cấp" ở góc (khung lớn). */
  showLabel?: boolean
}

/** Băm ổn định từ id phiên bản → biến thể hình (mỗi lần tạo lại ra một ảnh khác). */
function hash(value: string) {
  let result = 0
  for (const char of value) result = (result * 31 + char.charCodeAt(0)) >>> 0
  return result
}

const BACKGROUNDS = [
  ['#eef7ed', '#d6ecd4'],
  ['#f1f5f9', '#dbe3ec'],
  ['#fbf6ee', '#efe2cc'],
  ['#f3f1f8', '#e0dbee'],
]
const SKIN = ['#f1c9a5', '#e5b48c', '#d9a27a', '#f5d4b8']
const HAIR = ['#1f2937', '#3f2a1d', '#111827', '#57534e']
const CLOTHES = ['#39b536', '#475569', '#9a3412', '#1e3a8a', '#7c3aed', '#0f766e']

/**
 * Ảnh mẫu nhân vật: ảnh tải lên, hoặc chân dung minh họa vẽ bằng SVG (mô phỏng ảnh AI, không gọi API).
 * Chưa có ảnh mẫu → vòng chữ cái đầu tên.
 */
export function CharacterSampleImage({ sample, name, className, showLabel = false }: CharacterSampleImageProps) {
  if (!sample) {
    return (
      <span aria-hidden="true" className={cn('grid select-none place-items-center bg-[#eef2ee] font-bold text-[#4b5563]', className)}>
        {name.trim().charAt(0).toLocaleUpperCase('vi') || '?'}
      </span>
    )
  }

  if (sample.image) {
    return <img alt={`Ảnh mẫu ${name}`} className={cn('object-cover', className)} src={sample.image} />
  }

  const seed = hash(sample.id)
  const [bgTop, bgBottom] = BACKGROUNDS[seed % BACKGROUNDS.length]
  const skin = SKIN[(seed >> 3) % SKIN.length]
  const hair = HAIR[(seed >> 5) % HAIR.length]
  const clothes = CLOTHES[(seed >> 7) % CLOTHES.length]
  const longHair = (seed >> 9) % 2 === 0
  const gradientId = `sample-bg-${sample.id}`

  return (
    <span className={cn('relative block overflow-hidden', className)}>
      <svg aria-label={`Ảnh mẫu ${name}`} className="block size-full" preserveAspectRatio="xMidYMid slice" role="img" viewBox="0 0 90 120">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={bgTop} />
            <stop offset="1" stopColor={bgBottom} />
          </linearGradient>
        </defs>
        <rect fill={`url(#${gradientId})`} height="120" width="90" />
        {longHair && <path d="M24 46 C22 70 28 86 30 92 L60 92 C62 86 68 70 66 46 Z" fill={hair} />}
        <path d="M14 120 C14 94 28 84 45 84 C62 84 76 94 76 120 Z" fill={clothes} />
        <rect fill={skin} height="12" rx="4" width="14" x="38" y="72" />
        <ellipse cx="45" cy="54" fill={skin} rx="17" ry="20" />
        <path d={longHair ? 'M27 52 C26 34 36 28 45 28 C56 28 65 35 63 52 C58 42 50 38 45 38 C38 38 31 44 27 52 Z' : 'M28 48 C28 33 37 29 45 29 C54 29 63 33 62 48 C57 41 51 38 45 38 C38 38 33 41 28 48 Z'} fill={hair} />
        <circle cx="38.5" cy="55" fill="#1f2937" r="1.6" />
        <circle cx="51.5" cy="55" fill="#1f2937" r="1.6" />
        <path d="M40 64 Q45 67 50 64" fill="none" stroke="#9a5b45" strokeLinecap="round" strokeWidth="1.3" />
      </svg>
      {showLabel && (
        <span className="absolute bottom-1.5 left-1.5 rounded bg-black/45 px-1.5 py-0.5 text-[10px] font-medium text-white">
          Ảnh mẫu · {sample.tier === 'premium' ? 'Cao cấp' : 'Thường'}
        </span>
      )}
    </span>
  )
}
