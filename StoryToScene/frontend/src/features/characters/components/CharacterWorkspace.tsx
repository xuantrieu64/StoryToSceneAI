import { Plus, UsersRound } from 'lucide-react'
import { toast } from 'sonner'
import { projectPaths } from '@/features/Dashboard/lib/project-display'
import type { Character } from '../lib/character-storage'
import { CharacterCard } from './CharacterCard'

type CharacterWorkspaceProps = {
  projectId: string
  characters: Character[]
  approvedCount: number
  /** Thời điểm hiện tại (để tính trạng thái "đang tạo" của phiên bản). */
  now: number
  suggestions: { dialogue: string[]; scenes: string[] }
  /** Bấm chip tên nhân vật → mở form Thêm nhân vật đã điền sẵn tên. */
  onSuggestCharacter: (name: string) => void
}

/** Nội dung trang Nhân vật: khung "Duyệt ngoại hình", gợi ý tên, danh sách nhân vật (hoặc trạng thái rỗng). */
export function CharacterWorkspace({ projectId, characters, approvedCount, now, suggestions, onSuggestCharacter }: CharacterWorkspaceProps) {
  const characterCount = characters.length
  const progress = characterCount > 0 ? Math.round((approvedCount / characterCount) * 100) : 0

  return (
    <div className="flex flex-col gap-6">
      {/* Khung công đoạn: mục đích + tiến độ duyệt */}
      <section aria-labelledby="character-review-title" className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 rounded-xl border border-[#d7efd5] bg-[#f3faf2] px-6 py-5 max-[560px]:px-4">
        <div className="min-w-0 max-w-[640px]">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[1px] text-[#39b536]">Công đoạn · Nhân vật</p>
          <h2 className="mb-0 mt-1.5 text-base font-bold leading-6 text-[#111827]" id="character-review-title">
            Duyệt ngoại hình nhân vật
          </h2>
          <p className="mb-0 mt-1 text-[13px] leading-5 text-[#4b5563]">
            Bản đã duyệt được khóa cho mọi hình cú máy tạo sau, để các cảnh không bị lệch mặt.
          </p>
        </div>
        <div className="w-[180px] shrink-0 max-[560px]:w-full">
          <div
            aria-label="Tiến độ duyệt nhân vật"
            aria-valuemax={characterCount}
            aria-valuemin={0}
            aria-valuenow={approvedCount}
            className="h-1.5 overflow-hidden rounded-full bg-[#dcefd9]"
            role="progressbar"
          >
            <div className="h-full rounded-full bg-[#39b536] transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="mb-0 mt-2 text-right text-[13px] font-semibold text-[#111827] max-[560px]:text-left">
            {approvedCount} / {characterCount} đã duyệt
          </p>
        </div>
      </section>

      {/* Gợi ý từ tập đang chọn (tên đã có nhân vật thì không gợi ý nữa) */}
      {(suggestions.dialogue.length > 0 || suggestions.scenes.length > 0) && (
        <div className="flex flex-col gap-2.5">
          <SuggestionRow items={suggestions.dialogue} label="Gợi ý từ lời thoại:" onPick={onSuggestCharacter} />
          <SuggestionRow
            items={suggestions.scenes}
            label="Gợi ý từ tiêu đề cảnh:"
            onPick={(name) => toast.info('Thêm Địa điểm sẽ sớm được hỗ trợ', { description: `Gợi ý: ${name}` })}
          />
        </div>
      )}

      {characters.length > 0 ? (
        <ul aria-label="Danh sách nhân vật" className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-4 p-0">
          {characters.map((character) => (
            <li className="min-w-0" key={character.id}>
              <CharacterCard character={character} href={projectPaths.characterDetail(projectId, character.id)} now={now} />
            </li>
          ))}
        </ul>
      ) : (
        <section
          aria-labelledby="character-empty-title"
          className="grid min-h-[300px] place-items-center rounded-xl border border-dashed border-[#d1d5db] bg-white/60 px-6 py-12 text-center"
        >
          <div className="flex max-w-[420px] flex-col items-center">
            <span className="grid size-12 place-items-center rounded-xl border border-[#d7efd5] bg-[#f3faf2] text-[#39b536]">
              <UsersRound aria-hidden="true" className="size-6" strokeWidth={1.75} />
            </span>
            <h2 className="mb-0 mt-4 text-base font-bold leading-6 text-[#111827]" id="character-empty-title">
              Chưa có nhân vật
            </h2>
            <p className="mb-0 mt-1.5 text-[13px] leading-[22px] text-[#4b5563]">
              Thêm nhân vật, mô tả ngoại hình rồi tạo ảnh mẫu để hình các cú máy giữ đúng mặt.
            </p>
          </div>
        </section>
      )}
    </div>
  )
}

function SuggestionRow({ label, items, onPick }: { label: string; items: string[]; onPick: (name: string) => void }) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[13px] text-[#6b7280]">{label}</span>
      {items.map((name) => (
        <button
          className="inline-flex h-8 max-w-[220px] items-center gap-1 rounded-full border border-[#e5e7eb] bg-white px-3 text-[13px] text-[#374151] transition-colors hover:border-[#b9e3b6] hover:bg-[#f3faf2] hover:text-[#2f9a2d] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#39b536]"
          key={name}
          onClick={() => onPick(name)}
          title={`Thêm “${name}”`}
          type="button"
        >
          <Plus aria-hidden="true" className="size-3.5 shrink-0 text-[#9ca3af]" />
          <span className="truncate">{name}</span>
        </button>
      ))}
    </div>
  )
}
