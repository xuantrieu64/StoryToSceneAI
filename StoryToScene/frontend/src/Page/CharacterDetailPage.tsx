import { Link, useParams } from 'react-router-dom'
import { projectPaths } from '@/features/Dashboard/lib/project-display'
import { CharacterDetail } from '@/features/characters/components/CharacterDetail'
import { loadCharacters } from '@/features/characters/lib/character-storage'
import { ProjectLayout } from '@/features/project/components/ProjectLayout'
import { loadScripts } from '@/features/script/lib/script-storage'

/** Màn hình quản lý một nhân vật (/projects/:projectId/characters/:characterId). */
function CharacterDetailPage() {
  const { projectId, characterId } = useParams()

  return (
    <ProjectLayout active="characters" projectId={projectId} title="Nhân vật">
      {(project) => {
        // Đọc theo đúng dự án trên URL – nhân vật của dự án khác không mở được ở đây
        const character = loadCharacters(project.id).find((item) => item.id === characterId)
        return character ? (
          // key: chuyển nhân vật → nạp lại đúng dữ liệu
          <CharacterDetail character={character} key={character.id} projectId={project.id} scripts={loadScripts(project.id)} />
        ) : (
          <div className="grid min-h-[360px] place-items-center rounded-xl border border-dashed border-[#d1d5db] bg-white/40 p-8 text-center">
            <div>
              <h2 className="m-0 text-base font-bold leading-6 text-[#111827]">Không tìm thấy nhân vật</h2>
              <p className="mb-4 mt-1.5 text-xs leading-5 text-[#6b7280]">Nhân vật có thể đã bị xóa hoặc thuộc dự án khác.</p>
              <Link
                className="inline-flex min-h-[38px] items-center rounded-lg bg-[#39b536] px-4 text-xs text-white shadow-sm hover:bg-[#32a92f]"
                to={projectPaths.characters(project.id)}
              >
                Về danh sách nhân vật
              </Link>
            </div>
          </div>
        )
      }}
    </ProjectLayout>
  )
}

export default CharacterDetailPage
