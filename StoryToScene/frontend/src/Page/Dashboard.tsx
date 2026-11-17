import { useState } from 'react'
import { FormCreateStory } from '../Components/FormCreateStory/FormCreateStory'
import { Sidebar } from '../Components/Sidebar/Sidebar'

function Dashboard() {
  const [createFormOpen, setCreateFormOpen] = useState(false)
  const [projects, setProjects] = useState<string[]>([])

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] font-sans text-[#111827]">
      <Sidebar activeItem="projects" />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-start justify-between gap-6 px-10 pb-6 pt-8 max-[1000px]:px-7 max-[760px]:flex-col max-[760px]:gap-4 max-[760px]:px-5 max-[760px]:pb-[18px] max-[760px]:pt-6">
          <div>
            <h1 className="m-0 text-2xl font-bold leading-8 tracking-[-0.6px] text-[#111827] max-[760px]:text-[22px]">
              Dự án của tôi
            </h1>
            <p className="mb-0 mt-1 text-[13px] leading-5 text-[#6b7280] max-[760px]:max-w-[330px]">
              Mở một dự án để viết tiếp, hoặc tạo dự án mới từ truyện của bạn.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-4 pt-1 max-[760px]:w-full max-[760px]:justify-between">
            <span className="whitespace-nowrap text-xs leading-4 text-[#4b5563]">{projects.length}/1 dự án</span>
            <button
              className="min-h-8 rounded-lg bg-[#39b536] px-[14px] py-1.5 text-xs leading-4 text-white shadow-sm transition-colors hover:bg-[#32a92f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#198c22]"
              onClick={() => setCreateFormOpen(true)}
              type="button"
            >
              + Dự án mới
            </button>
          </div>
        </header>

        <section
          aria-label="Danh sách dự án"
          className="flex min-h-0 flex-1 flex-col px-10 pb-10 max-[1000px]:px-7 max-[760px]:px-5 max-[760px]:pb-5"
        >
          {projects.length === 0 ? (
            <div className="grid min-h-[460px] flex-1 place-items-center rounded-xl border border-dashed border-[#d1d5db] bg-white/40 p-8 text-center max-[760px]:min-h-[360px] max-[760px]:p-6">
              <div className="flex flex-col items-center">
                <span className="mb-4 grid size-10 place-items-center rounded-lg bg-[#f3f4f6] text-[#9ca3af]">
                  <CalendarIcon />
                </span>
                <h2 className="mb-2 mt-0 text-base font-bold leading-6 text-[#111827]">
                  Chưa có dự án nào
                </h2>
                <p className="mb-4 mt-0 text-xs leading-[19.5px] text-[#6b7280]">
                  Tạo dự án đầu tiên: đặt tên, dán tóm tắt truyện, chọn phong cách, rồi nhập chương
                  <br className="max-[760px]:hidden" /> để AI viết kịch bản.
                </p>
                <button
                  className="min-h-[38px] rounded-lg bg-[#39b536] px-4 py-2 text-xs leading-4 text-white shadow-sm transition-colors hover:bg-[#32a92f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#198c22]"
                  onClick={() => setCreateFormOpen(true)}
                  type="button"
                >
                  + Tạo dự án đầu tiên
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
              {projects.map((project, index) => (
                <article className="rounded-xl border border-[#e5e7eb] bg-white p-5" key={`${project}-${index}`}>
                  <div className="grid size-10 place-items-center rounded-lg bg-[#f3faf2] text-[#39b536]">
                    <CalendarIcon />
                  </div>
                  <h2 className="mb-1 mt-3.5 text-[15px] font-bold text-[#111827]">{project}</h2>
                  <p className="m-0 text-xs text-[#6b7280]">Dự án mới · Chưa có chương</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <FormCreateStory
        isOpen={createFormOpen}
        onClose={() => setCreateFormOpen(false)}
        onCreate={(projectName) => {
          setProjects((current) => [...current, projectName])
          setCreateFormOpen(false)
        }}
      />
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 3.5v3M16 3.5v3M4.5 9h15M8 12.5h2M13 12.5h2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </svg>
  )
}

export default Dashboard
