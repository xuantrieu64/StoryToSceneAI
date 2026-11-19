import { MapPin, Package, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EntityKind } from '../lib/character-storage'

const ICONS = { character: UserRound, location: MapPin, prop: Package }

/** Ảnh giữ chỗ (chưa có AI tạo ảnh): vòng tròn xám nhạt với biểu tượng theo loại. */
export function CharacterAvatar({ kind, className, iconClassName }: { kind: EntityKind; className?: string; iconClassName?: string }) {
  const Icon = ICONS[kind]
  return (
    <span aria-hidden="true" className={cn('grid shrink-0 place-items-center rounded-full bg-[#e5e7eb] text-[#9ca3af]', className)}>
      <Icon className={cn('size-1/2', iconClassName)} fill="currentColor" strokeWidth={0} />
    </span>
  )
}
