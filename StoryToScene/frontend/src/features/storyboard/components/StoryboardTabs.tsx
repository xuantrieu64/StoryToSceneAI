import type { ReactNode } from 'react'
import { formatDuration, sceneCharacters, sceneTitle, SHOT_SIZES, type Storyboard } from '../lib/storyboard-storage'

/** Tab Kế hoạch đạo diễn: tóm tắt từng cảnh – nhân vật, nhịp cú máy, cỡ cảnh chủ đạo, âm thanh, chuyển cảnh. */
export function DirectorPlanTab({ storyboard }: { storyboard: Storyboard }) {
  return (
    <ol className="m-0 list-none space-y-3 p-0">
      {storyboard.scenes.map((scene) => {
        const duration = scene.shots.reduce((sum, shot) => sum + shot.duration, 0)
        const sizes = SHOT_SIZES.map((size) => [size, scene.shots.filter((shot) => shot.size === size).length] as const).filter(([, count]) => count > 0)
        const sounds = [...new Set(scene.shots.map((shot) => shot.sound).filter(Boolean))]
        const transitions = scene.shots.flatMap((shot) => (shot.transition ? [`sau cú máy ${shot.number}: ${shot.transition}`] : []))
        const characters = sceneCharacters(scene)
        return (
          <li className="rounded-xl border border-[#eceef1] bg-white p-4" key={scene.id}>
            <h3 className="m-0 text-sm font-semibold text-[#111827]">{sceneTitle(scene)}</h3>
            <dl className="mb-0 mt-2.5 grid grid-cols-[120px_1fr] gap-x-3 gap-y-1.5 text-[13px] leading-5 max-[560px]:grid-cols-1">
              <PlanRow label="Nhịp">
                {scene.shots.length} cú máy · {formatDuration(duration)} · cú máy {scene.shots[0]?.number}–{scene.shots[scene.shots.length - 1]?.number}
              </PlanRow>
              <PlanRow label="Nhân vật">{characters.join(', ') || 'Không có nhân vật – cảnh bối cảnh'}</PlanRow>
              <PlanRow label="Cỡ cảnh">{sizes.map(([size, count]) => `${size} ×${count}`).join(' · ')}</PlanRow>
              <PlanRow label="Âm thanh">{sounds.join(' · ') || '—'}</PlanRow>
              <PlanRow label="Chuyển cảnh">{transitions.join(' · ') || 'Cắt thẳng'}</PlanRow>
            </dl>
          </li>
        )
      })}
    </ol>
  )
}

function PlanRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-[#6b7280]">{label}</dt>
      <dd className="m-0 text-[#1f2937]">{children}</dd>
    </>
  )
}
