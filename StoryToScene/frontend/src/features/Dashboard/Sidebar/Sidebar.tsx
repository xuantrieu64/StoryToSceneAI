import { useRef, useState, useSyncExternalStore, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { siteLinks } from '@/config/site-links'

/* Kéo thanh phân chia để đổi chiều rộng Sidebar (chỉ trên màn hình > 760px). */
const SIDEBAR_DEFAULT_WIDTH = 256
const SIDEBAR_MIN_WIDTH = 200
const SIDEBAR_MAX_WIDTH = 360
/** Kéo hẹp hơn mức này → tự thu gọn về dạng chỉ có icon. */
const SIDEBAR_COLLAPSE_AT = 150
const SIDEBAR_COLLAPSED_WIDTH = 76
const KEYBOARD_STEP = 16
const WIDTH_STORAGE_KEY = 'storytoscene.sidebar.width'

/** Tối đa 30% bề rộng màn hình (khớp `max-w-[30vw]` của aside) để nội dung chính không bị ép trên màn hình hẹp. */
const SIDEBAR_MAX_VIEWPORT_RATIO = 0.3

function clampWidth(value: number) {
  const max = Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, window.innerWidth * SIDEBAR_MAX_VIEWPORT_RATIO))
  return Math.min(max, Math.max(SIDEBAR_MIN_WIDTH, Math.round(value)))
}

/** Chiều rộng đã lưu – giữ nguyên khi chuyển trang (Sidebar được gắn lại ở mỗi trang). */
function readStoredWidth() {
  try {
    const stored = Number(window.localStorage.getItem(WIDTH_STORAGE_KEY))
    // Chỉ giới hạn min/max cố định; giới hạn theo màn hình do CSS `max-w` lo, để mở rộng cửa sổ lại vẫn đúng.
    return stored ? Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(stored))) : SIDEBAR_DEFAULT_WIDTH
  } catch {
    return SIDEBAR_DEFAULT_WIDTH
  }
}

function storeWidth(width: number) {
  try {
    window.localStorage.setItem(WIDTH_STORAGE_KEY, String(width))
  } catch {
    // Bộ nhớ trình duyệt bị chặn – chỉ mất tính năng ghi nhớ, không ảnh hưởng kéo thả.
  }
}

/* ── Chế độ "rail" (thu gọn chỉ còn icon) ──────────────────────────────────
 * Bật khi người dùng thu gọn HOẶC màn hình < 760px (cùng mốc với `max-[760px]:` của Tailwind).
 * Mọi khối trong rail là cột flex `items-center` và mọi mục là ô vuông RAIL_ITEM 40×40,
 * nên logo, nút, icon điều hướng, công đoạn 1–8 và avatar luôn nằm trên cùng một trục dọc,
 * cùng vùng bấm, cùng khoảng cách – không căn tay từng icon. */
const NARROW_QUERY = '(max-width: 759.98px)'
const RAIL_COLUMN = 'flex flex-col items-center gap-1'
const RAIL_ITEM = 'grid size-10 shrink-0 place-items-center rounded-lg p-0'

function subscribeNarrow(onChange: () => void) {
  const media = window.matchMedia(NARROW_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

const useIsNarrow = () => useSyncExternalStore(subscribeNarrow, () => window.matchMedia(NARROW_QUERY).matches)

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
  rail?: boolean
  icon: 'folder' | 'list'
  label: string
  /** Route đích; không có thì hiển thị dạng nút. */
  to?: string
}

function NavigationItem({ active = false, rail = false, icon, label, to }: NavigationItemProps) {
  const className = `${rail ? RAIL_ITEM : 'flex min-h-10 w-full items-center rounded-lg px-[14px] py-2.5 text-left text-[13.5px]'} transition-colors ${active
    ? 'bg-[#eaf7e9] text-[#39b536]'
    : 'text-[#4b5563] hover:bg-gray-50'
    }`
  const content = (
    <>
      {icon === 'folder' ? <FolderIcon /> : <ListIcon />}
      {!rail && <span className="truncate pl-3">{label}</span>}
    </>
  )

  if (to) {
    return (
      <Link aria-current={active ? 'page' : undefined} aria-label={label} className={className} title={rail ? label : undefined} to={to}>
        {content}
      </Link>
    )
  }

  return (
    <button aria-current={active ? 'page' : undefined} aria-label={label} className={className} title={rail ? label : undefined} type="button">
      {content}
    </button>
  )
}

function OpenProjectSection({ rail, project }: { rail: boolean; project: OpenProjectNav }) {
  return (
    <nav aria-label={`Dự án đang mở: ${project.name}`} className={rail ? `mt-4 ${RAIL_COLUMN}` : 'mt-5 grid grid-cols-[minmax(0,1fr)] gap-0.5'}>
      {!rail && (
        <p className="mb-1 mt-0 px-[14px] text-[10.5px] font-semibold uppercase tracking-[0.6px] text-[#9ca3af]">Đang mở</p>
      )}
      <div className={rail ? RAIL_ITEM : 'mb-1.5 flex items-center gap-2 px-[14px]'} title={rail ? project.name : undefined}>
        <span className="relative size-6 shrink-0 overflow-hidden rounded-md bg-[#eaf7e9]">
          {project.cover ? (
            <img alt="" className="absolute inset-0 size-full object-cover" src={project.cover} />
          ) : (
            <span className="absolute inset-0 grid place-items-center [&_svg]:size-4">
              <BrandIcon />
            </span>
          )}
        </span>
        {!rail && (
          <strong className="truncate text-[13px] leading-5 text-[#111827]" title={project.name}>
            {project.name}
          </strong>
        )}
      </div>

      {project.items.map((item) => {
        const className = `${rail ? RAIL_ITEM : 'flex min-h-9 w-full items-center gap-2.5 rounded-lg px-[14px] py-2 text-left text-[13.5px]'} transition-colors ${
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
            {!rail && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
            {!rail && item.status && (
              <span className="max-w-[72px] shrink-0 truncate text-[11px] font-normal text-[#9ca3af]">{item.status}</span>
            )}
          </>
        )
        const label = item.status ? `${item.label} – ${item.status}` : item.label

        return item.href ? (
          <Link
            aria-current={item.active ? 'page' : undefined}
            aria-label={label}
            className={className}
            key={item.key}
            title={rail ? label : undefined}
            to={item.href}
          >
            {content}
          </Link>
        ) : (
          <span
            aria-disabled="true"
            aria-label={`${label} (sắp ra mắt)`}
            className={className}
            key={item.key}
            title={rail ? `${item.label} (sắp ra mắt)` : 'Sắp ra mắt'}
          >
            {content}
          </span>
        )
      })}
    </nav>
  )
}

export function Sidebar({ activeItem = 'projects', onOpenGuide, guideOpen = false, openProject }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const isNarrow = useIsNarrow()
  /** Thu gọn (người dùng chọn) hoặc màn hình hẹp → hiển thị dạng rail chỉ có icon. */
  const rail = collapsed || isNarrow
  const [width, setWidth] = useState(readStoredWidth)
  const [resizing, setResizing] = useState(false)
  const drag = useRef<{ startX: number; startWidth: number; width: number; collapsed: boolean } | null>(null)

  function handleResizeStart(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    // Bắt đầu từ chiều rộng đang hiển thị thực tế (có thể đã bị giới hạn 30vw trên màn hình hẹp)
    const renderedWidth = event.currentTarget.parentElement?.getBoundingClientRect().width ?? width
    drag.current = { startX: event.clientX, startWidth: collapsed ? SIDEBAR_COLLAPSED_WIDTH : renderedWidth, width, collapsed }
    setResizing(true)
    // Giữ con trỏ resize và chặn bôi đen chữ trong lúc kéo, kể cả khi chuột ra khỏi thanh kéo.
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  function handleResizeMove(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current
    if (!state) return
    const raw = state.startWidth + event.clientX - state.startX
    state.collapsed = raw < SIDEBAR_COLLAPSE_AT
    if (!state.collapsed) state.width = clampWidth(raw)
    setCollapsed(state.collapsed)
    setWidth(state.width)
  }

  function handleResizeEnd(event: PointerEvent<HTMLDivElement>) {
    const state = drag.current
    if (!state) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    drag.current = null
    setResizing(false)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    if (!state.collapsed) storeWidth(state.width)
  }

  function resizeTo(next: number) {
    const value = clampWidth(next)
    setCollapsed(false)
    setWidth(value)
    storeWidth(value)
  }

  function handleResizeKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      if (collapsed) return
      if (width - KEYBOARD_STEP < SIDEBAR_MIN_WIDTH) setCollapsed(true)
      else resizeTo(width - KEYBOARD_STEP)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      resizeTo(collapsed ? width : width + KEYBOARD_STEP)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      setCollapsed((value) => !value)
    }
  }

  const toggleLabel = collapsed ? 'Mở rộng Sidebar' : 'Thu gọn Sidebar'
  const ToggleIcon = collapsed ? ChevronRight : ChevronLeft

  return (
    <aside
      className={`relative flex min-h-screen shrink-0 flex-col justify-between border-r border-[rgba(229,231,235,0.8)] bg-white max-[760px]:w-[68px] ${
        resizing ? '' : 'transition-[width] duration-200 ease-out'
      } ${collapsed ? 'w-[76px]' : 'w-(--sidebar-width) min-[760px]:max-w-[max(200px,30vw)]'}`}
      style={{ '--sidebar-width': `${width}px` } as CSSProperties}
    >
      {/* Thanh phân chia: kéo trái/phải để đổi chiều rộng, nhấp đúp để về mặc định. Ẩn trên màn hình nhỏ. */}
      <div
        aria-label="Kéo để đổi chiều rộng thanh bên"
        aria-orientation="vertical"
        aria-valuemax={SIDEBAR_MAX_WIDTH}
        aria-valuemin={SIDEBAR_COLLAPSED_WIDTH}
        aria-valuenow={collapsed ? SIDEBAR_COLLAPSED_WIDTH : width}
        className="group absolute inset-y-0 -right-1.5 z-20 w-3 cursor-col-resize touch-none outline-none max-[760px]:hidden"
        onDoubleClick={() => resizeTo(SIDEBAR_DEFAULT_WIDTH)}
        onKeyDown={handleResizeKey}
        onLostPointerCapture={handleResizeEnd}
        onPointerCancel={handleResizeEnd}
        onPointerDown={handleResizeStart}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeEnd}
        role="separator"
        tabIndex={0}
        title="Kéo để đổi chiều rộng · Nhấp đúp để về mặc định"
      >
        <span
          className={`absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 transition-colors duration-150 group-hover:bg-[#39b536]/50 group-focus-visible:bg-[#39b536] ${
            resizing ? 'bg-[#39b536]' : 'bg-transparent'
          }`}
        />
      </div>

      {/*
        Nút thu gọn/mở rộng: tròn 24px, đè lên mép phải, ngang tâm logo
        (mở rộng: tâm logo y=32px → top 20px; rail: logo 40×40 → tâm y=40px → top 28px).
        Là phần tử anh em của thanh kéo, nằm trên (z-30) nên bấm nút không kích hoạt kéo;
        phần mép còn lại vẫn kéo được. Ẩn trên màn hình hẹp vì Sidebar luôn thu gọn ở đó.
      */}
      {!isNarrow && (
        <button
          aria-expanded={!collapsed}
          aria-label={toggleLabel}
          className={`absolute -right-3 z-30 grid size-6 place-items-center rounded-full border border-[#e5e7eb] bg-white text-[#9ca3af] shadow-[0_1px_3px_rgba(16,24,40,0.08)] transition-[color,border-color,top] duration-200 hover:border-[#b9e3b6] hover:text-[#39b536] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536] ${
            rail ? 'top-7' : 'top-5'
          }`}
          onClick={() => setCollapsed((value) => !value)}
          title={toggleLabel}
          type="button"
        >
          <ToggleIcon aria-hidden="true" className="size-3.5" strokeWidth={2.2} />
        </button>
      )}

      {/* min-w-0 + overflow-hidden: nội dung không tràn ra ngoài trong lúc chiều rộng đang chuyển động */}
      <div className={`min-w-0 overflow-hidden pb-4 pt-5 ${rail ? '' : 'px-4'}`}>
        {rail ? (
          // Rail: logo nằm trên cùng trục với các icon bên dưới
          <div className={`mb-4 ${RAIL_COLUMN}`}>
            <a aria-label="StoryToScene, trang chủ" className={RAIL_ITEM} href="#" title="StoryToScene">
              <BrandIcon />
            </a>
          </div>
        ) : (
          <div className="mb-6 flex h-6 items-center justify-between px-1">
            <a
              aria-label="StoryToScene, trang chủ"
              className="flex min-w-0 items-center text-[15px] font-bold tracking-[-0.375px] text-[#111827]"
              href="#"
            >
              <BrandIcon />
              <span className="truncate pl-2.5">StoryToScene</span>
            </a>
          </div>
        )}

        <nav aria-label="Điều hướng chính" className={rail ? RAIL_COLUMN : 'grid gap-1'}>
          <NavigationItem active={activeItem === 'projects'} icon="folder" label="Dự án của tôi" rail={rail} to={siteLinks.studio} />
          <NavigationItem active={activeItem === 'tasks'} icon="list" label="Danh sách việc" rail={rail} />
        </nav>

        {openProject && <OpenProjectSection project={openProject} rail={rail} />}
      </div>

      <div className={`min-w-0 overflow-hidden border-t border-[#f3f4f6] pb-3 ${rail ? `pt-3 ${RAIL_COLUMN}` : 'px-3 pt-[13px]'}`}>
        <button
          aria-expanded={guideOpen}
          aria-haspopup="dialog"
          aria-label="Hướng dẫn"
          className={`${rail ? RAIL_ITEM : 'flex h-8 w-full items-center gap-[9px] rounded-lg px-1.5 text-left text-[13px]'} text-[#374151] hover:bg-gray-50`}
          onClick={onOpenGuide}
          title={rail ? 'Hướng dẫn' : undefined}
          type="button"
        >
          <span className="grid size-5 shrink-0 place-items-center rounded-full border border-[#9ca3af] text-[#6b7280]">
            <PlayIcon />
          </span>
          {!rail && <span>Hướng dẫn</span>}
        </button>

        {!rail && (
          <div className="mt-2 rounded-xl border border-[#b9e3b6] bg-[#f3faf2] p-3">
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
        )}

        <button
          aria-label="Tài khoản tvxt12"
          className={`${rail ? RAIL_ITEM : 'mt-2 flex w-full items-center rounded-lg px-1.5 pb-1.5 pt-2 text-left'} hover:bg-gray-50`}
          title={rail ? 'tvxt12' : undefined}
          type="button"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#eaf7e9] text-xs font-bold text-[#39b536]">
            T
          </span>
          {!rail && (
            <>
              <span className="grid min-w-0 flex-1 pl-2.5">
                <strong className="truncate text-xs leading-4 text-[#111827]">tvxt12</strong>
                <small className="truncate text-[11px] text-[#6b7280]">tvxt12@gmail.com</small>
              </span>
              <ChevronIcon />
            </>
          )}
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
