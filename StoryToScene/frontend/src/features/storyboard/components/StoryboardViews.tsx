import { Users } from 'lucide-react'
import { sceneCharacters, sceneTitle, type Storyboard } from '../lib/storyboard-storage'
import { ShotCard } from './ShotCard'

export type StoryboardViewProps = {
  storyboard: Storyboard
  selectedShot: number | null
  highlightedShot: number | null
  onOpenShot: (shotNumber: number) => void
}

/** Chế độ Storyboard: nhóm theo cảnh, mỗi cú máy một thẻ có hình (lưới 1 → 2 → 3 cột theo bề rộng cột kết quả). */
export function StoryboardGrid({ storyboard, selectedShot, highlightedShot, onOpenShot }: StoryboardViewProps) {
  return (
    <div className="@container space-y-7">
      {storyboard.scenes.map((scene) => {
        const characters = sceneCharacters(scene)
        return (
          <section aria-label={sceneTitle(scene)} key={scene.id}>
            <h3 className="m-0 mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm font-semibold text-[#111827]">
              {sceneTitle(scene)}
              {characters.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-normal text-[#6b7280]">
                  <Users aria-hidden="true" className="size-3.5" />
                  Nhân vật: {characters.join(', ')}
                </span>
              )}
              <span className="ml-auto text-xs font-normal text-[#9ca3af]">{scene.shots.length} cú máy</span>
            </h3>
            <ol className="m-0 grid list-none grid-cols-1 gap-3 p-0 @md:grid-cols-2 @min-[620px]:grid-cols-3">
              {scene.shots.map((shot) => (
                <ShotCard
                  heading={scene.heading}
                  highlighted={shot.number === highlightedShot}
                  key={shot.id}
                  onOpen={() => onOpenShot(shot.number)}
                  selected={shot.number === selectedShot}
                  shot={shot}
                />
              ))}
            </ol>
          </section>
        )
      })}
    </div>
  )
}
