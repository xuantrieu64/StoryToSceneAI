import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { siteLinks } from '@/config/site-links'
import { FormCreateStory } from '../features/Dashboard/FormCreateStory/FormCreateStory'
import { createProject, loadProjects, saveProjects, toProjectInput, updateProject } from '../features/Dashboard/lib/project-storage'
import { ProjectCard } from '../features/Dashboard/ProjectCard/ProjectCard'
import { Sidebar } from '../features/Dashboard/Sidebar/Sidebar'
import { TutorialPanel } from '../features/Dashboard/TutorialPanel/TutorialPanel'
import { PROJECT_LIMIT, type CreateProjectInput, type Project } from '../features/Dashboard/types/project'
import { removeStory } from '../features/story/lib/story-storage'

const upgradePath = siteLinks.upgrade ?? '/upgrade'
const limitMessage = `Gói Miễn phí tạo tối đa ${PROJECT_LIMIT} dự án. Xóa bớt một dự án, hoặc nâng gói để tạo thêm.`

function Dashboard() {
  const navigate = useNavigate()
  const [createFormOpen, setCreateFormOpen] = useState(false)
  /** Dự án đang chỉnh sửa; null = form ở chế độ tạo mới. */
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  // Tạm lưu bằng localStorage (giải pháp frontend) – xem lib/project-storage.ts
  const [projects, setProjects] = useState<Project[]>(loadProjects)
  const [guideOpen, setGuideOpen] = useState(false)
  const limitReached = projects.length >= PROJECT_LIMIT

  useEffect(() => {
    saveProjects(projects)
  }, [projects])

  function showLimitToast() {
    toast.error('Đã đạt giới hạn dự án', {
      description: limitMessage,
      action: { label: 'Nâng gói', onClick: () => navigate(upgradePath) },
    })
  }

  function openCreateForm() {
    if (limitReached) {
      showLimitToast()
      return
    }
    setEditingProject(null)
    setCreateFormOpen(true)
  }

  /** Chỉnh sửa không tạo dự án mới nên không kiểm tra hạn mức. */
  function openEditForm(project: Project) {
    setEditingProject(project)
    setCreateFormOpen(true)
  }

  function closeForm() {
    setCreateFormOpen(false)
    setEditingProject(null)
  }

  function handleSubmit(input: CreateProjectInput) {
    if (editingProject) handleEdit(editingProject, input)
    else handleCreate(input)
  }

  function handleEdit(target: Project, input: CreateProjectInput) {
    const exists = projects.some((item) => item.id === target.id)
    if (!exists) {
      toast.error('Dự án không còn tồn tại.')
      closeForm()
      return
    }
    setProjects((current) => current.map((item) => (item.id === target.id ? updateProject(item, input) : item)))
    closeForm()
    toast.success(`Đã lưu thay đổi cho “${input.name}”`)
  }

  function handleCreate(input: CreateProjectInput) {
    if (limitReached) {
      showLimitToast()
      closeForm()
      return
    }
    const project = createProject(input)
    setProjects((current) => [project, ...current])
    closeForm()
    toast.success(`Đã tạo dự án “${project.name}”`)
  }

  function handleDelete(project: Project) {
    setProjects((current) => current.filter((item) => item.id !== project.id))
    removeStory(project.id) // xóa luôn truyện đã nhập của dự án này
    toast.success(`Đã xóa dự án “${project.name}”`)
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fa] font-sans text-[#111827]">
      <Sidebar activeItem="projects" guideOpen={guideOpen} onOpenGuide={() => setGuideOpen(true)} />

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
            <span className="whitespace-nowrap text-xs leading-4 text-[#4b5563]">{projects.length}/{PROJECT_LIMIT} dự án</span>
            <button
              aria-disabled={limitReached}
              className="min-h-8 rounded-lg bg-[#39b536] px-[14px] py-1.5 text-xs leading-4 text-white shadow-sm transition-colors hover:bg-[#32a92f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#198c22]"
              onClick={openCreateForm}
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
                  onClick={openCreateForm}
                  type="button"
                >
                  + Tạo dự án đầu tiên
                </button>
              </div>
            </div>
          ) : (
            <>
              {limitReached && (
                <p
                  className="mb-4 mt-0 rounded-lg border border-[#b9e3b6] bg-[#f3faf2] px-4 py-2.5 text-xs leading-5 text-[#374151]"
                  role="status"
                >
                  {limitMessage}{' '}
                  <Link className="ml-1 font-bold text-[#39b536] hover:underline" to={upgradePath}>
                    Nâng gói
                  </Link>
                </p>
              )}
              <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-4">
                {projects.map((project) => (
                  <ProjectCard key={project.id} onDelete={handleDelete} onEdit={openEditForm} project={project} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>
      <FormCreateStory
        isOpen={createFormOpen}
        // key: mỗi dự án / chế độ là một phiên form riêng, điền lại từ dữ liệu đã lưu
        key={editingProject?.id ?? 'create'}
        initialValues={editingProject ? toProjectInput(editingProject) : undefined}
        mode={editingProject ? 'edit' : 'create'}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />
      <TutorialPanel open={guideOpen} onClose={() => setGuideOpen(false)} />
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
