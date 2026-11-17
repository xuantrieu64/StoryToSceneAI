type CardProjectProps = {
  createdAtDateTime: string
  createdAtLabel: string
  title: string
}

export function CardProject({ createdAtDateTime, createdAtLabel, title }: CardProjectProps) {
  return (
    <article
      aria-label={`Dự án ${title}`}
      className="isolate flex min-w-0 flex-col overflow-hidden rounded-xl border border-[rgba(226,232,240,0.9)] bg-white px-px pb-px pt-[9px] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]"
      data-node-id="58:574"
    >
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-t-[11px] bg-[#f1f5f9]">
        <img
          alt=""
          className="absolute left-0 top-[-109.13%] h-[318.25%] w-full max-w-none"
          src="/assets/projects/cover-letter-rain.png"
        />
        <div className="absolute left-[10px] top-[10px] flex items-center gap-1.5">
          <span className="rounded-md bg-[#39b536]/90 px-2 py-0.5 text-[10.5px] leading-[15.75px] text-white backdrop-blur">
            Tiểu thuyết
          </span>
          <span className="rounded-md bg-black/60 px-1.5 py-0.5 text-[10.5px] leading-[15.75px] text-white backdrop-blur">
            16:9
          </span>
        </div>
        <span
          aria-hidden="true"
          className="absolute right-[10px] top-[10px] grid size-6 place-items-center rounded-full bg-black/50 backdrop-blur"
        >
          <img alt="" className="size-[14px]" src="/assets/projects/more.svg" />
        </span>
      </div>

      <div className="flex min-h-[152px] flex-1 flex-col justify-between p-[14px]">
        <div className="flex flex-col gap-0.5">
          <h2 className="m-0 truncate text-sm font-bold leading-[21px] text-[#0f172a]">{title}</h2>
          <p className="m-0 truncate text-[11.5px] leading-[17.25px] text-[#94a3b8]">
            Tình cảm, đời thường · Người thật,…
          </p>
          <p className="m-0 line-clamp-2 min-h-[39px] text-xs leading-[19.5px] text-[#64748b]">
            Chưa có nội dung truyện. Thêm tóm tắt để bắt đầu tạo kịch bản.
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#f1f5f9] pt-[13px] text-[11px] leading-[16.5px] text-[#94a3b8]">
          <span className="whitespace-nowrap">0 chương&nbsp; · &nbsp;0 kịch bản</span>
          <time className="whitespace-nowrap" dateTime={createdAtDateTime}>
            Tạo {createdAtLabel}
          </time>
        </div>
      </div>
    </article>
  )
}
