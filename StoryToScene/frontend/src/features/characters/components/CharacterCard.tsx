import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { activeVersion, isApproved, versionStatus, type Character } from '../lib/character-storage'
import { CharacterAvatar } from './CharacterAvatar'

/** Thẻ nhân vật trong danh sách – bấm để mở trang quản lý nhân vật. */
export function CharacterCard({ character, href, now }: { character: Character; href: string; now: number }) {
  const active = activeVersion(character)
  const generating = character.versions.some((version) => versionStatus(version, now) === 'generating')
  const approved = isApproved(character, now)
  const status = generating ? { label: 'Đang tạo…', className: 'border-[#fde68a] bg-[#fffbeb] text-[#b45309]' } : approved ? { label: 'Đã duyệt', className: 'border-[#b9e3b6] bg-[#eaf7e9] text-[#2f9a2d]' } : { label: 'Chưa duyệt', className: 'border-[#e5e7eb] bg-[#f9fafb] text-[#6b7280]' }

  return (
    <Link
      className="group flex min-w-0 gap-4 rounded-xl border border-[#e5e7eb] bg-white p-4 transition-colors hover:border-[#b9e3b6] hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]"
      to={href}
    >
      <CharacterAvatar className="size-14" kind={character.kind} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="m-0 truncate text-[15px] font-semibold leading-6 text-[#111827] group-hover:text-[#2f9a2d]">{character.name}</h3>
          <span className={cn('shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold', status.className)}>{status.label}</span>
        </div>
        <p className="m-0 text-xs text-[#9ca3af]">
          Đang dùng v{active.number} · {character.versions.length} phiên bản
        </p>
        <p className="mb-0 mt-1.5 line-clamp-2 text-[13px] leading-5 text-[#4b5563]">{character.description}</p>
      </div>
    </Link>
  )
}
