import { groupByScene, splitParenthetical, type ScriptBlock } from '../../lib/script-blocks'

/** Chế độ đọc: trình bày như kịch bản phim, không có nhãn loại dòng và công cụ sửa. */
export function ReadingView({ blocks }: { blocks: ScriptBlock[] }) {
  const groups = groupByScene(blocks)

  return (
    <article className="mx-auto max-w-[680px] py-2 font-sans text-[15px] leading-7 text-[#1f2937]">
      {groups.map((group) => (
        <section className="mb-8 scroll-mt-40 last:mb-0" id={group.scene ? `scene-${group.scene.id}` : undefined} key={group.scene?.id ?? 'intro'}>
          {group.scene && (
            <h3 className="mb-3 mt-0 text-sm font-bold uppercase tracking-[0.6px] text-[#111827]">
              Cảnh {group.number}. {group.scene.text}
            </h3>
          )}
          {group.lines.map((line) => {
            if (line.type === 'dialogue') {
              const { note, line: speech } = splitParenthetical(line.text)
              return (
                <div className="mx-auto my-3 max-w-[440px] text-center" key={line.id}>
                  <p className="m-0 text-[13px] font-bold uppercase tracking-[0.6px] text-[#111827]">{line.character || 'Nhân vật'}</p>
                  {note && <p className="m-0 text-[13px] italic text-[#6b7280]">({note})</p>}
                  <p className="m-0 whitespace-pre-wrap">{speech}</p>
                </div>
              )
            }
            if (line.type === 'transition') {
              return (
                <p className="my-3 text-right text-[13px] font-semibold uppercase tracking-[0.6px] text-[#4b5563]" key={line.id}>
                  {line.text}
                </p>
              )
            }
            return (
              <p className="my-2 whitespace-pre-wrap" key={line.id}>
                {line.text}
              </p>
            )
          })}
        </section>
      ))}
    </article>
  )
}
