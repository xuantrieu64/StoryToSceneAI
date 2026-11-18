import { useState } from 'react'
import { Link } from 'react-router-dom'
import { siteLinks } from '@/config/site-links'

type SidebarProps = {
  /** null = không mục nào đang chọn (vd. trang Nâng cấp gói). */
  activeItem?: 'projects' | 'tasks' | null
  /** Mở bảng Hướng dẫn. */
  onOpenGuide?: () => void
  guideOpen?: boolean
  /** Dự án đang mở (màn hình Tổng quan / các công đoạn). Không truyền = không hiển thị khối "Đang mở". */
  openProject?: OpenProjectNav
}

export type OpenProjectNavItem = {
  key: string
  label: string
  /** Số thứ tự công đoạn; không có = mục "Tổng quan". */
  number?: number
  status?: string
  /** Route; không có = công đoạn chưa triển khai (không bấm được). */
  href?: string
  active?: boolean
}

export type OpenProjectNav = {
  name: string
  cover: string | null
  items: OpenProjectNavItem[]
}

type NavigationItemProps = {
  active?: boolean
  collapsed?: boolean
  icon: 'folder' | 'list'
  label: string
  /** Route đích; không có thì hiển thị dạng nút. */
  to?: string
}

function NavigationItem({ active = false, collapsed = false, icon, label, to }: NavigationItemProps) {
  const className = `flex min-h-10 w-full items-center rounded-lg px-[14px] py-2.5 text-left text-[13.5px] transition-colors ${active
    ? 'bg-[#eaf7e9] text-[#39b536]'
    : 'text-[#4b5563] hover:bg-gray-50'
    }`
  const content = (
    <>
      {icon === 'folder' ? <FolderIcon /> : <ListIcon />}
      <span className={`truncate pl-3 ${collapsed ? 'hidden' : 'max-[760px]:hidden'}`}>{label}</span>
    </>
  )

  if (to) {
    return (
      <Link aria-current={active ? 'page' : undefined} aria-label={label} className={className} to={to}>
        {content}
      </Link>
    )
  }

  return (
    <button aria-current={active ? 'page' : undefined} className={className} type="button">
      {content}
    </button>
  )
}

function OpenProjectSection({ collapsed, project }: { collapsed: boolean; project: OpenProjectNav }) {
  const hideText = collapsed ? 'hidden' : 'max-[760px]:hidden'

  return (
    <nav aria-label={`Dự án đang mở: ${project.name}`} className="mt-5 grid gap-0.5">
      <p className={`mb-1 mt-0 px-[14px] text-[10.5px] font-semibold uppercase tracking-[0.6px] text-[#9ca3af] ${hideText}`}>
        Đang mở
      </p>
      <div className={`mb-1.5 flex items-center gap-2 px-[14px] ${collapsed ? 'justify-center px-0' : 'max-[760px]:justify-center max-[760px]:px-0'}`}>
        <span className="relative size-6 shrink-0 overflow-hidden rounded-md bg-[#eaf7e9]">
          {project.cover ? (
            <img alt="" className="absolute inset-0 size-full object-cover" src={project.cover} />
          ) : (
            <span className="absolute inset-0 grid place-items-center [&_svg]:size-4">
              <BrandIcon />
            </span>
          )}
        </span>
        <strong className={`truncate text-[13px] leading-5 text-[#111827] ${hideText}`} title={project.name}>
          {project.name}
        </strong>
      </div>

      {project.items.map((item) => {
        const className = `flex min-h-9 w-full items-center gap-2.5 rounded-lg px-[14px] py-2 text-left text-[13.5px] transition-colors ${
          collapsed ? 'justify-center px-0' : 'max-[760px]:justify-center max-[760px]:px-0'
        } ${
          item.active
            ? 'bg-[#eaf7e9] font-semibold text-[#39b536]'
            : item.href
              ? 'text-[#4b5563] hover:bg-gray-50'
              : 'cursor-default text-[#6b7280]'
        }`
        const content = (
          <>
            {item.number === undefined ? (
              <OverviewIcon />
            ) : (
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-md text-[11px] font-semibold ${
                  item.active ? 'bg-[#39b536] text-white' : 'bg-[#f3f4f6] text-[#6b7280]'
                }`}
              >
                {item.number}
              </span>
            )}
            <span className={`min-w-0 flex-1 truncate ${hideText}`}>{item.label}</span>
            {item.status && (
              <span className={`max-w-[72px] shrink-0 truncate text-[11px] font-normal text-[#9ca3af] ${hideText}`}>{item.status}</span>
            )}
          </>
        )
        const label = item.status ? `${item.label} – ${item.status}` : item.label

        return item.href ? (
          <Link aria-current={item.active ? 'page' : undefined} aria-label={label} className={className} key={item.key} to={item.href}>
            {content}
          </Link>
        ) : (
          <span aria-disabled="true" aria-label={`${label} (sắp ra mắt)`} className={className} key={item.key} title="Sắp ra mắt">
            {content}
          </span>
        )
      })}
    </nav>
  )
}

export function Sidebar({ activeItem = 'projects', onOpenGuide, guideOpen = false, openProject }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const toggleButton = (
    <button
      aria-expanded={!collapsed}
      aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
      className="grid size-10 shrink-0 place-items-center rounded-md p-1 text-[#9ca3af] hover:bg-[#e6ffe6] max-[760px]:hidden"
      onClick={() => setCollapsed((value) => !value)}
      type="button"
    >
      <PanelIcon />
    </button>
  )

  return (
    <aside
      className={`relative flex min-h-screen shrink-0 flex-col justify-between border-r border-[rgba(229,231,235,0.8)] bg-white transition-[width] duration-200 max-[760px]:w-[68px] ${collapsed ? 'w-[76px]' : 'w-64'
        }`}
    >
      <div className={`pb-4 pt-5 max-[760px]:px-2 ${collapsed ? 'px-2' : 'px-4'}`}>
        <div
          className={`mb-6 flex h-6 items-center px-1 max-[760px]:justify-center max-[760px]:px-0 ${collapsed ? 'justify-center' : 'justify-between'
            }`}
        >
          <a
            aria-label="StoryToScene, trang chủ"
            className="flex min-w-0 items-center text-[15px] font-bold tracking-[-0.375px] text-[#111827]"
            href="#"
          >
            <BrandIcon />
            <span className={`truncate pl-2.5 max-[760px]:hidden ${collapsed ? 'hidden' : ''}`}>
              StoryToScene
            </span>
          </a>

          {/* Mở rộng: nút cùng hàng với logo */}
          {!collapsed && toggleButton}
        </div>

        <nav aria-label="Điều hướng chính" className="grid gap-1">
          {/* Thu gọn: nút nằm trên icon "Dự án của tôi" */}
          {collapsed && <div className="mb-1 flex justify-center max-[760px]:hidden">{toggleButton}</div>}

          <NavigationItem active={activeItem === 'projects'} collapsed={collapsed} icon="folder" label="Dự án của tôi" to={siteLinks.studio} />
          <NavigationItem active={activeItem === 'tasks'} collapsed={collapsed} icon="list" label="Danh sách việc" />
        </nav>

        {openProject && <OpenProjectSection collapsed={collapsed} project={openProject} />}
      </div>

      <div className="border-t border-[#f3f4f6] px-3 pb-3 pt-[13px] max-[760px]:px-2">
        <button
          aria-expanded={guideOpen}
          aria-haspopup="dialog"
          aria-label="Hướng dẫn"
          className="flex h-8 w-full items-center gap-[9px] rounded-lg px-1.5 text-left text-[13px] text-[#374151] hover:bg-gray-50"
          onClick={onOpenGuide}
          type="button"
        >
          <span className="grid size-5 shrink-0 place-items-center rounded-full border border-[#9ca3af] text-[#6b7280]">
            <PlayIcon />
          </span>
          <span className={collapsed ? 'hidden' : 'max-[760px]:hidden'}>Hướng dẫn</span>
        </button>

        <div className={`mt-2 rounded-xl border border-[#b9e3b6] bg-[#f3faf2] p-3 ${collapsed ? 'hidden' : 'max-[760px]:hidden'}`}>
          <div className="flex items-center justify-between text-xs leading-4 text-[#111827]">
            <span>Gói Miễn phí</span>
            <Link className="font-bold text-[#39b536] hover:underline" to={siteLinks.upgrade ?? '/upgrade'}>
              Nâng gói
            </Link>
          </div>
          <p className="mb-0 mt-0.5 text-[11px] leading-5 text-[#6b7280]">
            Hôm nay <span className="text-[#39b536]">0/10</span> lượt AI
          </p>
        </div>

        <button
          className="mt-2 flex w-full items-center rounded-lg px-1.5 pb-1.5 pt-2 text-left hover:bg-gray-50 max-[760px]:justify-center max-[760px]:px-0"
          type="button"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#eaf7e9] text-xs font-bold text-[#39b536]">
            T
          </span>
          <span className={`grid min-w-0 flex-1 pl-2.5 ${collapsed ? 'hidden' : 'max-[760px]:hidden'}`}>
            <strong className="truncate text-xs leading-4 text-[#111827]">tvxt12</strong>
            <small className="truncate text-[11px] text-[#6b7280]">tvxt12@gmail.com</small>
          </span>
          <ChevronIcon className={collapsed ? 'hidden' : 'max-[760px]:hidden'} />
        </button>
      </div>
    </aside>
  )
}

export function BrandIcon() {
  return (
    <svg aria-hidden="true" className="size-6 shrink-0" fill="none" viewBox="0 0 24 24">
      <path d="M4 11v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8H4Z" fill="#EAF7E9" stroke="#39B536" strokeWidth="2" />
      <path d="m4 11 2-6h12l2 6M7 5l1.5 6M12 5v6m5-6-1.5 6" stroke="#39B536" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg aria-hidden="true" className="size-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h5l2 2h7A1.5 1.5 0 0 1 20.5 8.5v9A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5v-11Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M4 9h16" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg aria-hidden="true" className="size-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <circle cx="4.5" cy="6" r="1" fill="currentColor" />
      <circle cx="4.5" cy="12" r="1" fill="currentColor" />
      <circle cx="4.5" cy="18" r="1" fill="currentColor" />
    </svg>
  )
}

function OverviewIcon() {
  return (
    <svg aria-hidden="true" className="size-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 9h8M8 12.5h8M8 16h5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

function PanelIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 20 20">
      <rect x="3" y="3" width="14" height="14" rx="1.5" stroke="currentColor" />
      <path d="M12.5 3.5v13M10 8l-2 2 2 2" stroke="currentColor" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg aria-hidden="true" className="size-2.5" fill="none" viewBox="0 0 12 12">
      <path d="m4.5 3.2 4 2.8-4 2.8V3.2Z" fill="currentColor" />
    </svg>
  )
}

function ChevronIcon({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={`size-4 shrink-0 text-[#9ca3af] ${className}`} fill="none" viewBox="0 0 16 16">
      <path d="m4 10 4-4 4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  )
}
