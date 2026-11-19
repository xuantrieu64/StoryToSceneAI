import { useState, type ReactNode } from 'react'
import { ChevronLeft, PencilLine, RefreshCw, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { projectPaths } from '@/features/Dashboard/lib/project-display'
import { ConfirmDeleteDialog } from '@/features/story/components/ConfirmDeleteDialog'
import type { Script } from '@/features/script/lib/script-storage'
import { cn } from '@/lib/utils'
import { tierById, type GenerationTierId } from '../data/generation-tiers'
import {
  activeVersion,
  CHARACTER_DESCRIPTION_LIMIT,
  findByName,
  generationDeadline,
  KIND_LABELS,
  loadCharacters,
  MAX_CHARACTER_VERSIONS,
  saveCharacters,
  updateCharacter,
  versionStatus,
  withNewVersion,
  type Character,
} from '../lib/character-storage'
import { consumeGeneration, loadSelectedTier, remainingToday, saveSelectedTier } from '../lib/generation-usage'
import { useNow } from '../lib/use-now'
import { CharacterAvatar } from './CharacterAvatar'
import { CharacterFormDialog } from './CharacterFormDialog'
import { TierToggle } from './TierToggle'

type CharacterDetailProps = {
  projectId: string
  character: Character
  /** Các tập của dự án (để chọn tập xuất hiện). */
  scripts: Script[]
}

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <h3 className="mb-2.5 mt-0 text-[11px] font-semibold uppercase tracking-[1px] text-[#9ca3af]">{children}</h3>
)

/** Trang quản lý một nhân vật: xem trước phiên bản (giữa) + thông tin & thiết lập (panel phải). */
export function CharacterDetail({ projectId, character: initial, scripts }: CharacterDetailProps) {
  const navigate = useNavigate()
  const [character, setCharacter] = useState(initial)
  /** Phiên bản đang xem (khác với bản đang dùng cho cú máy). */
  const [viewingId, setViewingId] = useState(initial.activeVersionId)
  const [tier, setTier] = useState<GenerationTierId>(loadSelectedTier)
  const [editingDescription, setEditingDescription] = useState<string | null>(null)
  const [form, setForm] = useState({ open: false, key: 0 })
  const [confirmDelete, setConfirmDelete] = useState(false)

  const now = useNow(generationDeadline([character]))
  const active = activeVersion(character)
  const viewing = character.versions.find((version) => version.id === viewingId) ?? active
  const viewingStatus = versionStatus(viewing, now)
  const activeReady = versionStatus(active, now) === 'ready'
  const anyGenerating = character.versions.some((version) => versionStatus(version, now) === 'generating')
  const remaining = remainingToday(tier)
  const kindLabel = KIND_LABELS[character.kind].toLocaleLowerCase('vi')
  const validEpisodes = scripts.filter((script) => character.episodeIds.includes(script.id))

  /** Lưu thay đổi cho đúng nhân vật này (projectId + characterId). */
  function save(update: (current: Character) => Character, success?: string) {
    const saved = updateCharacter(projectId, character.id, update)
    if (!saved) {
      toast.error('Không lưu được thay đổi', { description: 'Bộ nhớ trình duyệt có thể đã đầy.' })
      return null
    }
    setCharacter(saved)
    if (success) toast.success(success)
    return saved
  }

  function createVersion() {
    if (anyGenerating || remaining === 0) return
    if (!consumeGeneration(tier)) {
      toast.error(`Đã hết lượt ${tierById(tier).label.toLocaleLowerCase('vi')} hôm nay`)
      return
    }
    const saved = save((current) => withNewVersion(current, tier))
    if (saved) {
      const added = saved.versions.at(-1)!
      setViewingId(added.id)
      toast.success(`Đang tạo v${added.number}`, { description: 'Ảnh xem trước là ảnh giữ chỗ – chưa kết nối AI tạo ảnh.' })
    }
  }

  function toggleEpisode(scriptId: string) {
    const selected = character.episodeIds.includes(scriptId)
    if (selected && validEpisodes.length === 1) {
      toast.info(`Nhân vật cần xuất hiện trong ít nhất một tập`)
      return
    }
    save((current) => ({
      ...current,
      episodeIds: selected ? current.episodeIds.filter((id) => id !== scriptId) : [...current.episodeIds, scriptId],
    }))
  }

  function deleteCharacter() {
    const rest = loadCharacters(projectId).filter((item) => item.id !== character.id)
    if (!saveCharacters(projectId, rest)) {
      toast.error('Không xóa được nhân vật')
      return
    }
    toast.success(`Đã xóa “${character.name}”`)
    navigate(projectPaths.characters(projectId))
  }

  return (
    <div className="flex h-[calc(100vh-152px)] min-h-[600px] overflow-hidden rounded-xl border border-[#eceef1] bg-white max-[900px]:h-auto max-[900px]:flex-col">
      {/* Xem trước (giữa) */}
      <section aria-label="Xem trước" className="flex min-w-0 flex-1 flex-col bg-[#f8f9fa] max-[900px]:min-h-[420px]">
        <div className="flex items-center justify-between gap-3 px-5 pt-4">
          <Link className="inline-flex items-center gap-1 rounded-md py-1 pr-1 text-[13px] text-[#4b5563] hover:text-[#39b536] focus-visible:outline-2 focus-visible:outline-[#39b536]" to={projectPaths.characters(projectId)}>
            <ChevronLeft aria-hidden="true" className="size-4" />
            Danh sách nhân vật
          </Link>
          <span className="text-xs text-[#9ca3af]">Đang xem v{viewing.number}</span>
        </div>
        <div className="grid flex-1 place-items-center px-6 py-8">
          <div className="flex flex-col items-center">
            <div className="flex aspect-[3/4] w-[260px] max-w-full flex-col items-center justify-center gap-5 rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <CharacterAvatar className={cn('size-28', viewingStatus === 'generating' && 'animate-pulse')} kind={character.kind} />
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
                  viewingStatus === 'generating' ? 'border-[#fde68a] bg-[#fffbeb] text-[#b45309]' : 'border-[#e5e7eb] bg-white text-[#4b5563]',
                )}
                role="status"
              >
                <span className={cn('size-1.5 rounded-full', viewingStatus === 'generating' ? 'animate-pulse bg-[#f59e0b]' : 'bg-[#39b536]')} />
                {viewingStatus === 'generating' ? 'Đang tạo bản xem trước…' : `Bản xem trước v${viewing.number}`}
              </span>
            </div>
            <p className="mb-0 mt-4 text-sm font-semibold text-[#111827]">{character.name}</p>
            <p className="mb-0 mt-0.5 text-xs text-[#9ca3af]">Ảnh giữ chỗ – chưa kết nối AI tạo ảnh</p>
          </div>
        </div>
      </section>

      {/* Thông tin & thiết lập (phải) */}
      <aside aria-label={`Thiết lập ${kindLabel}`} className="flex w-[380px] shrink-0 flex-col overflow-y-auto border-l border-[#eceef1] max-[1100px]:w-[340px] max-[900px]:w-full max-[900px]:border-l-0 max-[900px]:border-t">
        <div className="flex flex-col gap-6 p-5">
          {/* Tên */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="m-0 text-[11px] font-semibold uppercase tracking-[1px] text-[#39b536]">{KIND_LABELS[character.kind]}</p>
              <h2 className="m-0 mt-0.5 break-words text-lg font-bold leading-7 text-[#111827]">{character.name}</h2>
            </div>
            <button
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-[#e5e7eb] px-2.5 text-xs font-medium text-[#374151] hover:bg-gray-50"
              onClick={() => setForm((state) => ({ open: true, key: state.key + 1 }))}
              type="button"
            >
              <PencilLine aria-hidden="true" className="size-3.5" />
              Sửa
            </button>
          </div>

          {/* Phiên bản */}
          <section>
            <SectionTitle>Phiên bản</SectionTitle>
            <div className="grid grid-cols-2 gap-2.5" role="listbox" aria-label="Phiên bản">
              {character.versions.map((version) => {
                const status = versionStatus(version, now)
                const isViewing = version.id === viewing.id
                const isActive = version.id === active.id
                return (
                  <button
                    aria-selected={isViewing}
                    className={cn(
                      'rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]',
                      isViewing ? 'border-[#39b536] bg-[#f3faf2] ring-1 ring-[#39b536]' : 'border-[#e5e7eb] bg-white hover:border-[#b9e3b6]',
                    )}
                    key={version.id}
                    onClick={() => setViewingId(version.id)}
                    role="option"
                    type="button"
                  >
                    <span className="block text-[13px] font-bold text-[#111827]">v{version.number}</span>
                    <span className={cn('block text-xs', status === 'generating' ? 'text-[#b45309]' : isActive ? 'text-[#2f9a2d]' : 'text-[#9ca3af]')}>
                      {status === 'generating' ? 'đang tạo' : isActive ? 'đang dùng' : 'sẵn sàng'}
                      {version.tier === 'premium' && ' · cao cấp'}
                    </span>
                  </button>
                )
              })}
            </div>
            <p className="mb-0 mt-3 text-[13px] text-[#374151]">
              Đang xem v{viewing.number} · các cú máy đang dùng v{active.number}
            </p>
            {viewing.id !== active.id && (
              <button
                className="mt-2 inline-flex h-8 items-center rounded-lg border border-[#39b536] bg-white px-3 text-xs font-semibold text-[#39b536] hover:bg-[#f3faf2] disabled:cursor-not-allowed disabled:border-[#d1d5db] disabled:text-[#9ca3af]"
                disabled={viewingStatus !== 'ready'}
                onClick={() => save((current) => ({ ...current, activeVersionId: viewing.id }), `Đã dùng v${viewing.number} cho các cú máy`)}
                title={viewingStatus !== 'ready' ? 'Chờ tạo xong để dùng bản này' : undefined}
                type="button"
              >
                Dùng v{viewing.number} cho các cú máy
              </button>
            )}
            <p className="mb-0 mt-1.5 text-xs leading-5 text-[#9ca3af]">
              Giữ tối đa {MAX_CHARACTER_VERSIONS} phiên bản; bản cũ nhất không dùng tới sẽ tự xóa khi có bản mới.
            </p>
          </section>

          {/* Mô tả */}
          <section>
            <SectionTitle>Mô tả</SectionTitle>
            {editingDescription === null ? (
              <>
                <p className="m-0 whitespace-pre-wrap text-[13px] leading-[22px] text-[#1f2937]">{character.description}</p>
                {viewing.description !== character.description && (
                  <p className="mb-0 mt-1.5 text-xs leading-5 text-[#b45309]">v{viewing.number} được tạo từ mô tả cũ – tạo phiên bản mới để áp dụng mô tả này.</p>
                )}
                <button
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-[#39b536] hover:underline"
                  onClick={() => setEditingDescription(character.description)}
                  type="button"
                >
                  <PencilLine aria-hidden="true" className="size-3.5" />
                  Sửa mô tả
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2">
                <textarea
                  aria-label="Mô tả"
                  autoFocus
                  className="h-28 w-full resize-y rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-[13px] leading-[22px] text-[#1f2937] outline-none focus:border-[#39b536] focus:ring-2 focus:ring-[#39b536]/15"
                  maxLength={CHARACTER_DESCRIPTION_LIMIT}
                  onChange={(event) => setEditingDescription(event.target.value)}
                  value={editingDescription}
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs tabular-nums text-[#9ca3af]">
                    {editingDescription.length}/{CHARACTER_DESCRIPTION_LIMIT} ký tự
                  </span>
                  <div className="flex gap-2">
                    <button className="h-8 rounded-lg bg-[#f3f4f6] px-3 text-xs font-medium text-[#374151] hover:bg-[#e5e7eb]" onClick={() => setEditingDescription(null)} type="button">
                      Hủy
                    </button>
                    <button
                      className="h-8 rounded-lg bg-[#39b536] px-3 text-xs font-semibold text-white hover:bg-[#32a92f] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!editingDescription.trim()}
                      onClick={() => {
                        if (save((current) => ({ ...current, description: editingDescription.trim() }), 'Đã lưu mô tả')) setEditingDescription(null)
                      }}
                      type="button"
                    >
                      Lưu
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Xuất hiện trong */}
          <section>
            <SectionTitle>Xuất hiện trong</SectionTitle>
            {scripts.length === 0 ? (
              <p className="m-0 text-[13px] text-[#9ca3af]">Dự án chưa có tập kịch bản.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {scripts.map((script) => {
                  const selected = character.episodeIds.includes(script.id)
                  return (
                    <button
                      aria-pressed={selected}
                      className={cn(
                        'h-8 rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#39b536]',
                        selected ? 'border-[#b9e3b6] bg-[#eaf7e9] text-[#2f9a2d]' : 'border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#b9e3b6]',
                      )}
                      key={script.id}
                      onClick={() => toggleEpisode(script.id)}
                      title={script.title}
                      type="button"
                    >
                      Tập {script.episode}
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          {/* Khóa ngoại hình */}
          <section className={cn('flex items-start gap-3 rounded-xl border p-4', character.lockAppearance ? 'border-[#d7efd5] bg-[#f3faf2]' : 'border-[#e5e7eb] bg-[#f9fafb]')}>
            <button
              aria-checked={character.lockAppearance}
              aria-label="Khóa ngoại hình xuyên cảnh"
              className={cn(
                'relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536] disabled:cursor-not-allowed disabled:opacity-50',
                character.lockAppearance ? 'bg-[#39b536]' : 'bg-[#d1d5db]',
              )}
              disabled={!activeReady}
              onClick={() =>
                save(
                  (current) => ({ ...current, lockAppearance: !current.lockAppearance }),
                  character.lockAppearance ? 'Đã mở khóa ngoại hình' : `Đã duyệt & khóa v${active.number}`,
                )
              }
              role="switch"
              title={!activeReady ? 'Chờ bản đang dùng tạo xong' : undefined}
              type="button"
            >
              <span className={cn('absolute top-0.5 size-4 rounded-full bg-white shadow transition-[left]', character.lockAppearance ? 'left-[18px]' : 'left-0.5')} />
            </button>
            <div>
              <p className="m-0 text-[13px] font-semibold text-[#111827]">Khóa ngoại hình xuyên cảnh</p>
              <p className="mb-0 mt-0.5 text-xs leading-5 text-[#6b7280]">
                {character.lockAppearance ? `Đã duyệt v${active.number} – hình cú máy mới gửi kèm đúng bản này.` : 'Hình cú máy mới gửi kèm đúng bản đang dùng.'}
              </p>
            </div>
          </section>

          {/* Tạo phiên bản mới */}
          <section className="flex flex-col gap-2.5">
            <TierToggle
              full
              onChange={(next) => {
                setTier(next)
                saveSelectedTier(next)
              }}
              tier={tier}
            />
            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#e5e7eb] bg-[#f3f4f6] text-[13px] font-semibold text-[#111827] transition-colors hover:border-[#b9e3b6] hover:bg-[#eaf7e9] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-[#e5e7eb] disabled:hover:bg-[#f3f4f6]"
              disabled={anyGenerating || remaining === 0}
              onClick={createVersion}
              title={anyGenerating ? 'Đang tạo một phiên bản – chờ xong rồi tạo tiếp' : remaining === 0 ? 'Đã hết lượt hôm nay' : undefined}
              type="button"
            >
              <RefreshCw aria-hidden="true" className={cn('size-4 text-[#39b536]', anyGenerating && 'animate-spin')} />
              Tạo phiên bản mới · 1 lượt {tierById(tier).label.toLocaleLowerCase('vi')}
            </button>
          </section>

          <button
            className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-[#dc2626] hover:underline"
            onClick={() => setConfirmDelete(true)}
            type="button"
          >
            <Trash2 aria-hidden="true" className="size-3.5" />
            Xóa {kindLabel}
          </button>
        </div>
      </aside>

      <CharacterFormDialog
        initial={{ kind: character.kind, name: character.name, description: character.description }}
        key={form.key}
        mode="edit"
        onClose={() => setForm((state) => ({ ...state, open: false }))}
        onSubmit={(values) => {
          const saved = save((current) => ({ ...current, name: values.name, description: values.description }), 'Đã lưu thay đổi')
          if (saved) setForm((state) => ({ ...state, open: false }))
          return Boolean(saved)
        }}
        open={form.open}
        validateName={(kind, name) => {
          const taken = findByName(loadCharacters(projectId), kind, name, character.id)
          return taken ? `Đã có “${taken.name}” trong dự án. Tên dùng để nhận diện nên không được trùng.` : null
        }}
      />

      <ConfirmDeleteDialog
        confirmLabel={`Xóa ${kindLabel}`}
        description={`“${character.name}” và ${character.versions.length} phiên bản sẽ bị xóa khỏi dự án. Không thể hoàn tác.`}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={deleteCharacter}
        open={confirmDelete}
        title={`Xóa ${kindLabel}?`}
      />
    </div>
  )
}
