import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Check, Clock, ImagePlus, LoaderCircle, PencilLine, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { projectPaths } from '@/features/Dashboard/lib/project-display'
import { tierById, type GenerationTierId } from '@/features/characters/data/generation-tiers'
import {
  createCharacter,
  findByName,
  loadCharacters,
  nameKey,
  referenceSample,
  sampleStatus,
  sampleVersions,
  saveCharacters,
  updateCharacter,
  versionStatus,
  withNewVersion,
  withUploadedSample,
  type Character,
} from '@/features/characters/lib/character-storage'
import { consumeGeneration, remainingToday } from '@/features/characters/lib/generation-usage'
import { ConfirmDeleteDialog } from '@/features/story/components/ConfirmDeleteDialog'
import { cn } from '@/lib/utils'
import { allShots, renameCharacterInStoryboards, sceneCharacters, type Storyboard } from '../lib/storyboard-storage'
import { CharacterEditorDialog, type CharacterEditorValues } from './CharacterEditorDialog'
import { CharacterSampleImage } from './CharacterSampleImage'

type FrameCharacterPanelProps = {
  projectId: string
  storyboard: Storyboard
  now: number
  tier: GenerationTierId
  /** Báo màn hình đọc lại dữ liệu sau khi nhân vật / cú máy thay đổi. */
  onChanged: () => void
  /** Lưu danh sách nhân vật trong khung của một cú máy; false = không lưu được. */
  onShotCharactersChange: (shotNumber: number, names: string[]) => boolean
}

type EditorState = { mode: 'create' | 'edit'; key: number; characterId?: string; name: string }

/**
 * Nhân vật ở bước Khung hình – dùng chung dữ liệu với mục 4 Nhân vật (cùng localStorage theo dự án, mọi tập):
 * danh sách vòng tròn · chi tiết (ảnh mẫu, mô tả, tạo / chọn ảnh mẫu, sửa, xóa) · chọn cú máy có nhân vật.
 * Tạo ảnh mẫu chỉ mô phỏng (chân dung vẽ trên frontend), không gọi API.
 */
export function FrameCharacterPanel({ projectId, storyboard, now, tier, onChanged, onShotCharactersChange }: FrameCharacterPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Character | null>(null)

  const characters = loadCharacters(projectId).filter((character) => character.kind === 'character')
  const selected = characters.find((character) => character.id === selectedId) ?? null
  const tierLabel = tierById(tier).label.toLocaleLowerCase('vi')
  // Tên xuất hiện trong cú máy của tập nhưng chưa có ở danh sách → gợi ý thêm
  const missingNames = [...new Set(storyboard.scenes.flatMap(sceneCharacters))].filter(
    (name) => !characters.some((character) => nameKey(character.name) === nameKey(name)),
  )

  const openEditor = (state: Omit<EditorState, 'key'>) => setEditor((current) => ({ ...state, key: (current?.key ?? 0) + 1 }))

  function save(characterId: string, update: (character: Character) => Character, success?: string) {
    const saved = updateCharacter(projectId, characterId, update)
    if (!saved) {
      toast.error('Không lưu được nhân vật', { description: 'Bộ nhớ trình duyệt có thể đã đầy.' })
      return null
    }
    if (success) toast.success(success)
    onChanged()
    return saved
  }

  function submit(values: CharacterEditorValues) {
    if (!editor) return false
    if (editor.mode === 'create') {
      let character = createCharacter({ kind: 'character', name: values.name, description: values.description, episodeIds: [storyboard.scriptId] })
      if (values.photo) character = withUploadedSample(character, values.photo)
      if (!saveCharacters(projectId, [...loadCharacters(projectId), character])) {
        toast.error('Không lưu được nhân vật', { description: 'Bộ nhớ trình duyệt có thể đã đầy – thử ảnh nhỏ hơn.' })
        return false
      }
      setSelectedId(character.id)
      setEditor(null)
      onChanged()
      toast.success(`Đã thêm nhân vật “${character.name}”`)
      return true
    }

    const current = characters.find((character) => character.id === editor.characterId)
    if (!current) return false
    const saved = save(current.id, (character) => {
      const next = { ...character, name: values.name, description: values.description }
      return values.photo ? withUploadedSample(next, values.photo) : next
    })
    if (!saved) return false
    // Đổi tên → cập nhật các cú máy đang dùng nhân vật (mọi tập)
    const renamed = current.name !== saved.name ? renameCharacterInStoryboards(projectId, current.name, saved.name) : 0
    setEditor(null)
    onChanged()
    toast.success(`Đã cập nhật “${saved.name}”`, renamed > 0 ? { description: `Đổi tên trong ${renamed} cú máy.` } : undefined)
    return true
  }

  function generateSample(character: Character) {
    if (!consumeGeneration(tier)) {
      toast.error(`Hết lượt tạo ảnh ${tierLabel} hôm nay`, { description: 'Chọn chất lượng khác hoặc quay lại vào ngày mai.' })
      return
    }
    save(character.id, (current) => {
      const next = withNewVersion(current, tier)
      const created = next.versions[next.versions.length - 1]
      // Ảnh mẫu mới thành ảnh tham chiếu, trừ khi đã khóa ngoại hình ở mục Nhân vật
      return current.lockAppearance ? next : { ...next, activeVersionId: created.id }
    })
  }

  function deleteCharacter(character: Character) {
    if (!saveCharacters(projectId, loadCharacters(projectId).filter((item) => item.id !== character.id))) {
      toast.error('Không xóa được nhân vật')
      return
    }
    setPendingDelete(null)
    if (selectedId === character.id) setSelectedId(null)
    onChanged()
    toast.success(`Đã xóa nhân vật “${character.name}”`)
  }

  function toggleShot(character: Character, shotNumber: number) {
    const shot = allShots(storyboard).find((item) => item.number === shotNumber)
    if (!shot) return
    const has = shot.characters.some((name) => nameKey(name) === nameKey(character.name))
    const names = has ? shot.characters.filter((name) => nameKey(name) !== nameKey(character.name)) : [...shot.characters, character.name]
    if (!onShotCharactersChange(shotNumber, names)) toast.error('Không lưu được cú máy')
  }

  return (
    <section aria-label="Nhân vật" className="rounded-xl border border-[#eceef1] bg-white p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="m-0 text-sm font-semibold text-[#111827]">
          Nhân vật{' '}
          <span className="ml-1 text-xs font-normal text-[#6b7280]">Ảnh mẫu giúp các khung hình giữ đúng mặt nhân vật · giống tương đối, không tuyệt đối</span>
        </h3>
        <Link className="text-xs font-medium text-[#198c22] hover:underline" to={projectPaths.characters(projectId)}>
          Phiên bản, duyệt, khóa ngoại hình ở màn Nhân vật
        </Link>
      </div>

      {/* Danh sách vòng tròn */}
      <ul className="m-0 mt-4 flex list-none flex-wrap gap-x-2 gap-y-3 p-0">
        {characters.map((character) => {
          const status = sampleStatus(character, now)
          const active = character.id === selectedId
          return (
            <li key={character.id}>
              <button
                aria-pressed={active}
                className={cn(
                  'flex w-[92px] flex-col items-center rounded-xl px-1 pb-2 pt-2.5 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]',
                  active ? 'bg-[#f3faf2] ring-1 ring-[#39b536]' : 'hover:bg-[#f9fafb]',
                )}
                onClick={() => setSelectedId(active ? null : character.id)}
                type="button"
              >
                <span className="relative">
                  <CharacterSampleImage
                    className={cn('size-14 rounded-full text-lg ring-2', status === 'ready' ? 'ring-[#39b536]' : 'ring-[#e5e7eb]')}
                    name={character.name}
                    sample={referenceSample(character, now)}
                  />
                  {status === 'ready' && (
                    <span className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-[#39b536] text-white ring-2 ring-white">
                      <Check aria-hidden="true" className="size-3" strokeWidth={3} />
                    </span>
                  )}
                  {status === 'generating' && (
                    <span className="absolute inset-0 grid place-items-center rounded-full bg-white/60">
                      <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-[#39b536]" />
                    </span>
                  )}
                </span>
                <span className="mt-1.5 w-full truncate text-[13px] font-semibold text-[#111827]">{character.name}</span>
                <span className={cn('text-[11px] leading-4', status === 'ready' ? 'text-[#198c22]' : 'text-[#9ca3af]')}>
                  {status === 'ready' ? 'có ảnh mẫu' : status === 'generating' ? 'đang tạo mẫu…' : 'chưa có ảnh mẫu'}
                </span>
              </button>
            </li>
          )
        })}
        <li>
          <button
            className="group flex w-[92px] flex-col items-center rounded-xl px-1 pb-2 pt-2.5 text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]"
            onClick={() => openEditor({ mode: 'create', name: '' })}
            type="button"
          >
            <span className="grid size-14 place-items-center rounded-full border-2 border-dashed border-[#d1d5db] text-[#9ca3af] transition-colors group-hover:border-[#39b536] group-hover:text-[#39b536]">
              <Plus aria-hidden="true" className="size-5" />
            </span>
            <span className="mt-1.5 text-[13px] font-semibold text-[#374151]">Thêm</span>
            <span className="text-[11px] leading-4 text-[#9ca3af]">nhân vật</span>
          </button>
        </li>
      </ul>

      {characters.length === 0 && <p className="mb-0 mt-2 text-xs text-[#6b7280]">Dự án chưa có nhân vật. Thêm nhân vật để các khung hình giữ đúng ngoại hình.</p>}
      {missingNames.length > 0 && (
        <p className="mb-0 mt-2 flex flex-wrap items-center gap-1.5 text-xs text-[#b45309]">
          Có trong cú máy nhưng chưa có ảnh mẫu:
          {missingNames.map((name) => (
            <button
              className="inline-flex h-6 items-center gap-1 rounded-md border border-[#fde68a] bg-[#fffbeb] px-2 font-medium hover:bg-[#fef3c7]"
              key={name}
              onClick={() => openEditor({ mode: 'create', name })}
              type="button"
            >
              <Plus aria-hidden="true" className="size-3" />
              {name}
            </button>
          ))}
        </p>
      )}

      {/* Chi tiết nhân vật */}
      {selected && (
        <CharacterDetailCard
          character={selected}
          key={selected.id}
          now={now}
          onChooseReference={(versionId) => save(selected.id, (current) => ({ ...current, activeVersionId: versionId }), 'Đã đổi ảnh tham chiếu')}
          onDelete={() => setPendingDelete(selected)}
          onEdit={() => openEditor({ mode: 'edit', characterId: selected.id, name: selected.name })}
          onGenerate={() => generateSample(selected)}
          onToggleShot={(shotNumber) => toggleShot(selected, shotNumber)}
          storyboard={storyboard}
          tier={tier}
        />
      )}

      {editor && (
        <CharacterEditorDialog
          initial={
            editor.mode === 'edit'
              ? { name: selected?.name ?? editor.name, description: characters.find((item) => item.id === editor.characterId)?.description ?? '' }
              : { name: editor.name, description: '' }
          }
          key={editor.key}
          mode={editor.mode}
          onClose={() => setEditor(null)}
          onSubmit={submit}
          open
          validateName={(name) => {
            if (!name.trim()) return 'Vui lòng nhập tên nhân vật.'
            const taken = findByName(loadCharacters(projectId), 'character', name, editor.characterId)
            return taken ? `Đã có “${taken.name}” trong dự án. Tên dùng để nhận diện nên không được trùng.` : null
          }}
        />
      )}

      <ConfirmDeleteDialog
        confirmLabel="Xóa nhân vật"
        description="Nhân vật và các ảnh mẫu sẽ bị xóa khỏi dự án (cả ở mục Nhân vật). Tên trong cú máy vẫn giữ nguyên."
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && deleteCharacter(pendingDelete)}
        open={pendingDelete !== null}
        title={pendingDelete ? `Xóa nhân vật “${pendingDelete.name}”?` : 'Xóa nhân vật?'}
      />
    </section>
  )
}

type CharacterDetailCardProps = {
  character: Character
  storyboard: Storyboard
  now: number
  tier: GenerationTierId
  onEdit: () => void
  onGenerate: () => void
  onDelete: () => void
  onChooseReference: (versionId: string) => void
  onToggleShot: (shotNumber: number) => void
}

function CharacterDetailCard({ character, storyboard, now, tier, onEdit, onGenerate, onDelete, onChooseReference, onToggleShot }: CharacterDetailCardProps) {
  const status = sampleStatus(character, now)
  const reference = referenceSample(character, now)
  const samples = sampleVersions(character)
  const tierLabel = tierById(tier).label.toLocaleLowerCase('vi')
  const remaining = remainingToday(tier)
  const shots = allShots(storyboard)

  return (
    <div className="mt-4 rounded-xl border border-[#e5efe4] bg-[#fbfdfb] p-4">
      <div className="flex gap-4 max-[560px]:flex-col">
        {/* Ảnh tham chiếu */}
        <div className="relative w-[150px] shrink-0 max-[560px]:w-full max-[560px]:max-w-[200px]">
          <CharacterSampleImage className="aspect-[3/4] w-full rounded-lg text-4xl ring-1 ring-[#e5e7eb]" name={character.name} sample={reference} showLabel />
          {status === 'generating' && (
            <span className="absolute inset-0 grid place-items-center rounded-lg bg-white/70 text-center">
              <span className="flex flex-col items-center text-xs font-medium text-[#374151]">
                <LoaderCircle aria-hidden="true" className="mb-1.5 size-6 animate-spin text-[#39b536]" />
                Đang tạo ảnh mẫu…
              </span>
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="m-0 text-base font-bold text-[#111827]">{character.name}</h4>
            <span
              className={cn(
                'inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-medium',
                status === 'ready' ? 'bg-[#ecf8eb] text-[#198c22]' : status === 'generating' ? 'bg-[#eff6ff] text-[#1d4ed8]' : 'bg-[#f3f4f6] text-[#6b7280]',
              )}
            >
              {status === 'ready' && <Check aria-hidden="true" className="size-3" strokeWidth={3} />}
              {status === 'ready' ? 'Đã có ảnh mẫu' : status === 'generating' ? 'Đang tạo ảnh mẫu' : 'Chưa có ảnh mẫu'}
            </span>
            <button
              className="inline-flex h-7 items-center gap-1 rounded-md border border-[#e5e7eb] bg-white px-2.5 text-xs font-medium text-[#374151] hover:bg-[#f9fafb]"
              onClick={onEdit}
              type="button"
            >
              <PencilLine aria-hidden="true" className="size-3.5" />
              Sửa thông tin
            </button>
          </div>

          <p className="mb-0 mt-2 whitespace-pre-line break-words text-[13px] leading-[22px] text-[#374151]">
            {character.description || <span className="text-[#9ca3af]">Chưa có mô tả ngoại hình.</span>}
          </p>

          <div className="mt-3.5 flex flex-wrap items-center gap-2">
            <button
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#39b536] px-4 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-[#32a92f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#198c22] disabled:cursor-not-allowed disabled:bg-[#a7dca5]"
              disabled={status === 'generating' || remaining === 0}
              onClick={onGenerate}
              title={remaining === 0 ? `Hết lượt ${tierLabel} hôm nay` : undefined}
              type="button"
            >
              {status === 'generating' ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : samples.length > 0 ? (
                <RefreshCw aria-hidden="true" className="size-4" />
              ) : (
                <ImagePlus aria-hidden="true" className="size-4" />
              )}
              {status === 'generating' ? 'Đang tạo ảnh mẫu…' : `${samples.length > 0 ? 'Tạo lại ảnh mẫu' : 'Tạo ảnh mẫu'} · 1 lượt ${tierLabel}`}
            </button>
            <span className="text-xs text-[#6b7280]">
              còn {remaining}/{tierById(tier).dailyLimit} hôm nay
            </span>
            <button
              className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-[#dc2626] hover:bg-[#fef2f2] max-[560px]:ml-0"
              onClick={onDelete}
              type="button"
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Xóa nhân vật
            </button>
          </div>
          {character.lockAppearance && <p className="mb-0 mt-2 text-xs text-[#6b7280]">Ngoại hình đã khóa ở mục Nhân vật – ảnh mẫu mới không tự thay ảnh tham chiếu.</p>}
        </div>
      </div>

      {/* Ảnh mẫu: chọn ảnh tham chiếu */}
      {samples.length > 0 && (
        <div className="mt-4">
          <p className="m-0 mb-2 text-xs font-semibold text-[#374151]">Ảnh mẫu · chọn một ảnh làm tham chiếu</p>
          <div className="flex flex-wrap gap-2.5" role="radiogroup">
            {samples.map((version) => {
              const ready = versionStatus(version, now) === 'ready'
              const chosen = reference?.id === version.id
              return (
                <button
                  aria-checked={chosen}
                  aria-label={`Ảnh mẫu v${version.number}${version.image ? ' (tải lên)' : ''}${chosen ? ', đang dùng làm tham chiếu' : ''}`}
                  className={cn(
                    'relative w-16 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536] disabled:cursor-progress',
                    chosen ? 'ring-2 ring-[#39b536] ring-offset-2' : 'opacity-80 hover:opacity-100',
                  )}
                  disabled={!ready}
                  key={version.id}
                  onClick={() => !chosen && onChooseReference(version.id)}
                  role="radio"
                  type="button"
                >
                  {ready ? (
                    <CharacterSampleImage className="aspect-[3/4] w-full rounded-lg" name={character.name} sample={version} />
                  ) : (
                    <span className="grid aspect-[3/4] w-full place-items-center rounded-lg bg-[#f3f4f6]">
                      <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-[#39b536]" />
                    </span>
                  )}
                  <span className="mt-1 block text-center text-[10px] text-[#6b7280]">
                    v{version.number} · {version.image ? 'tải lên' : version.tier === 'premium' ? 'cao cấp' : 'thường'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Cú máy có nhân vật (tập đang chọn) */}
      {shots.length > 0 && (
        <div className="mt-4">
          <p className="m-0 mb-2 text-xs font-semibold text-[#374151]">Xuất hiện trong cú máy của tập này · bấm để thêm / bỏ</p>
          <div className="flex flex-wrap gap-1.5">
            {shots.map((shot) => {
              const inShot = shot.characters.some((name) => nameKey(name) === nameKey(character.name))
              return (
                <button
                  aria-pressed={inShot}
                  className={cn(
                    'inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-medium tabular-nums transition-colors',
                    inShot ? 'border-[#39b536] bg-[#ecf8eb] text-[#198c22]' : 'border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#d1d5db]',
                  )}
                  key={shot.id}
                  onClick={() => onToggleShot(shot.number)}
                  title={`${shot.size} · ${shot.description}`}
                  type="button"
                >
                  {inShot && <Check aria-hidden="true" className="size-3" strokeWidth={3} />}
                  Cú {shot.number}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <p className="mb-0 mt-4 flex items-center gap-1.5 text-xs text-[#9ca3af]">
        <Clock aria-hidden="true" className="size-3.5" />
        Ảnh mẫu giữ tới khi xóa nhân vật · dùng cho mọi tập của dự án
      </p>
    </div>
  )
}
