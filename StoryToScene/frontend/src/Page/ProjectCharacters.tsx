import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { projectPaths } from '@/features/Dashboard/lib/project-display'
import { CharacterFormDialog, type CharacterFormValues } from '@/features/characters/components/CharacterFormDialog'
import { CharacterHeaderControls } from '@/features/characters/components/CharacterHeaderControls'
import { CharacterWorkspace } from '@/features/characters/components/CharacterWorkspace'
import type { GenerationTierId } from '@/features/characters/data/generation-tiers'
import { characterSuggestions } from '@/features/characters/lib/character-suggestions'
import { createCharacter, findByName, generationDeadline, isApproved, loadCharacters, nameKey, saveCharacters } from '@/features/characters/lib/character-storage'
import { loadSelectedTier, saveSelectedTier } from '@/features/characters/lib/generation-usage'
import { useNow } from '@/features/characters/lib/use-now'
import { ProjectLayout } from '@/features/project/components/ProjectLayout'
import { loadScripts } from '@/features/script/lib/script-storage'

/**
 * Màn hình Nhân vật (/projects/:projectId/characters).
 * Danh sách theo tập đang chọn; Thêm nhân vật → lưu theo projectId + tập hiện tại → mở trang quản lý nhân vật.
 */
function ProjectCharacters() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  // Lựa chọn của trang; đặt ngoài ProjectLayout để cụm điều khiển trên tiêu đề và nội dung dùng chung
  const [episodeId, setEpisodeId] = useState<string | null>(null)
  const [tier, setTier] = useState<GenerationTierId>(loadSelectedTier)
  /** Form đang mở + số lần mở (làm `key` để form luôn mới) + tên điền sẵn từ gợi ý. */
  const [form, setForm] = useState<{ open: boolean; key: number; name: string }>({ open: false, key: 0, name: '' })

  // Đọc trực tiếp từ bộ nhớ mỗi lần render (đúng dự án trên URL)
  const allCharacters = projectId ? loadCharacters(projectId) : []
  const scripts = projectId ? loadScripts(projectId) : []
  const episode = scripts.find((script) => script.id === episodeId) ?? scripts[0]
  // Nhân vật của tập đang chọn; dự án chưa có tập thì hiện tất cả
  const characters = allCharacters.filter((character) => character.kind === 'character' && (!episode || character.episodeIds.includes(episode.id)))
  const now = useNow(generationDeadline(allCharacters))
  const approvedCount = characters.filter((character) => isApproved(character, now)).length

  const existingNames = new Set(allCharacters.filter((character) => character.kind === 'character').map((character) => nameKey(character.name)))
  const rawSuggestions = characterSuggestions(episode)
  const suggestions = { dialogue: rawSuggestions.dialogue.filter((name) => !existingNames.has(nameKey(name))), scenes: rawSuggestions.scenes }

  const openForm = (name = '') => setForm((current) => ({ open: true, key: current.key + 1, name }))

  function create(values: CharacterFormValues) {
    if (!projectId) return false
    const current = loadCharacters(projectId)
    if (findByName(current, values.kind, values.name)) return false
    const character = createCharacter({ ...values, episodeIds: episode ? [episode.id] : [] })
    if (!saveCharacters(projectId, [...current, character])) {
      toast.error('Không lưu được nhân vật', { description: 'Bộ nhớ trình duyệt có thể đã đầy.' })
      return false
    }
    setForm((state) => ({ ...state, open: false }))
    toast.success(`Đã thêm nhân vật “${character.name}”`)
    navigate(projectPaths.characterDetail(projectId, character.id))
    return true
  }

  return (
    <ProjectLayout
      actions={() => (
        <CharacterHeaderControls
          episodeId={episode?.id ?? null}
          onAdd={() => openForm()}
          onEpisodeChange={setEpisodeId}
          onTierChange={(next) => {
            setTier(next)
            saveSelectedTier(next)
          }}
          scripts={scripts}
          tier={tier}
        />
      )}
      active="characters"
      projectId={projectId}
      subtitle={() => `${characters.length} nhân vật · ${approvedCount} đã duyệt`}
      title="Nhân vật"
    >
      {(project) => (
        <>
          <CharacterWorkspace
            approvedCount={approvedCount}
            characters={characters}
            now={now}
            onSuggestCharacter={(name) => openForm(name)}
            projectId={project.id}
            suggestions={suggestions}
          />
          <CharacterFormDialog
            initial={{ kind: 'character', name: form.name, description: '' }}
            key={form.key}
            mode="create"
            onClose={() => setForm((state) => ({ ...state, open: false }))}
            onSubmit={create}
            open={form.open}
            validateName={(kind, name) => {
              const taken = findByName(loadCharacters(project.id), kind, name)
              return taken ? `Đã có “${taken.name}” trong dự án. Tên dùng để nhận diện nên không được trùng.` : null
            }}
          />
        </>
      )}
    </ProjectLayout>
  )
}

export default ProjectCharacters
