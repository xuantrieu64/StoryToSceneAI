import type { Ref } from 'react'
import { Menu } from '@base-ui/react/menu'
import { BookOpen, Check, ChevronDown, ChevronLeft, History, PencilLine } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { projectPaths } from '@/features/Dashboard/lib/project-display'
import { cn } from '@/lib/utils'
import type { SceneGroup } from '../../lib/script-blocks'
import { scriptHeading, type Script } from '../../lib/script-storage'

export type EditorMode = 'edit' | 'read'

type EditorToolbarProps = {
  projectId: string
  script: Script
  scripts: Script[]
  mode: EditorMode
  onModeChange: (mode: EditorMode) => void
  charCount: number
  charLimit: number
  scenes: SceneGroup[]
  activeSceneId: string | null
  onJumpToScene: (sceneId: string) => void
  historyOpen: boolean
  onOpenHistory: () => void
  ref?: Ref<HTMLDivElement>
}

const formatCount = (value: number) => value.toLocaleString('vi-VN')

const toggleButton = (pressed: boolean) =>
  cn(
    'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]',
    pressed ? 'border-[#b9e3b6] bg-[#f3faf2] text-[#39b536]' : 'border-[#e5e7eb] bg-white text-[#374151] hover:bg-gray-50',
  )

/** Thanh công cụ dính trên cùng: quay lại danh sách, chọn tập, Biên tập / Đọc, số ký tự, đi tới cảnh. */
export function EditorToolbar({ projectId, script, scripts, mode, onModeChange, charCount, charLimit, scenes, activeSceneId, onJumpToScene, historyOpen, onOpenHistory, ref }: EditorToolbarProps) {
  const navigate = useNavigate()
  const overLimit = charCount > charLimit

  return (
    <div className="sticky top-0 z-20 rounded-t-xl border-b border-[#eef0f3] bg-white/95 px-6 backdrop-blur max-[760px]:px-4" ref={ref}>
      <div className="flex flex-wrap items-center justify-between gap-3 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            className="inline-flex shrink-0 items-center gap-1 rounded-md py-1 pr-1 text-[13px] text-[#4b5563] hover:text-[#39b536] focus-visible:outline-2 focus-visible:outline-[#39b536]"
            to={projectPaths.scripts(projectId)}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            Danh sách
          </Link>
          <Menu.Root>
            <Menu.Trigger
              className="inline-flex h-9 min-w-0 items-center gap-1.5 rounded-full bg-[#f3f4f6] px-4 text-[13px] font-semibold text-[#111827] outline-none transition-colors hover:bg-[#e5e7eb] focus-visible:ring-2 focus-visible:ring-[#39b536]/40"
              title="Chuyển tập"
            >
              <span className="truncate">{scriptHeading(script)}</span>
              {scripts.length > 1 && <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-[#6b7280]" />}
            </Menu.Trigger>
            {scripts.length > 1 && (
              <Menu.Portal>
                <Menu.Positioner align="start" className="z-40" sideOffset={6}>
                  <Menu.Popup className="max-h-[320px] min-w-[240px] max-w-[min(360px,calc(100vw-24px))] overflow-y-auto rounded-xl border border-[#e5e7eb] bg-white p-1.5 font-sans text-[13px] shadow-[0_12px_32px_-8px_rgba(15,23,42,0.18),0_2px_6px_rgba(15,23,42,0.06)] outline-none">
                    {scripts.map((item) => (
                      <Menu.Item
                        className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-[#374151] outline-none data-[highlighted]:bg-[#f3f4f6]"
                        key={item.id}
                        onClick={() => item.id !== script.id && navigate(projectPaths.scriptEditor(projectId, item.id))}
                      >
                        <span className="truncate">{scriptHeading(item)}</span>
                        {item.id === script.id && <Check aria-hidden="true" className="size-4 shrink-0 text-[#39b536]" />}
                      </Menu.Item>
                    ))}
                  </Menu.Popup>
                </Menu.Positioner>
              </Menu.Portal>
            )}
          </Menu.Root>
        </div>

        <div className="flex items-center gap-2">
          <button
            aria-expanded={historyOpen}
            aria-haspopup="dialog"
            className={cn(toggleButton(historyOpen), 'px-3 max-[420px]:w-9 max-[420px]:justify-center max-[420px]:px-0')}
            onClick={onOpenHistory}
            title="Lịch sử bản lưu"
            type="button"
          >
            <History aria-hidden="true" className="size-4" />
            <span className="max-[420px]:sr-only">Lịch sử</span>
          </button>
          <button aria-pressed={mode === 'edit'} className={cn(toggleButton(mode === 'edit'), 'px-3')} onClick={() => onModeChange('edit')} type="button">
            <PencilLine aria-hidden="true" className="size-4" />
            Biên tập
          </button>
          <button
            aria-label="Chế độ đọc"
            aria-pressed={mode === 'read'}
            className={cn(toggleButton(mode === 'read'), 'w-9 justify-center')}
            onClick={() => onModeChange(mode === 'read' ? 'edit' : 'read')}
            title={mode === 'read' ? 'Thoát chế độ đọc' : 'Chế độ đọc'}
            type="button"
          >
            <BookOpen aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-3 border-t border-[#f3f4f6] py-2.5 text-[13px]">
        <span className={cn('shrink-0 tabular-nums', overLimit ? 'font-semibold text-[#dc2626]' : 'text-[#6b7280]')}>
          {formatCount(charCount)}/{formatCount(charLimit)} ký tự
        </span>
        {scenes.length > 0 && (
          <>
            <span aria-hidden="true" className="h-4 w-px shrink-0 bg-[#e5e7eb]" />
            <span className="shrink-0 text-[#9ca3af] max-[560px]:hidden">Đi tới cảnh</span>
            <nav aria-label="Đi tới cảnh" className="-my-1 flex min-w-0 flex-1 gap-2 overflow-x-auto py-1 [scrollbar-width:thin]">
              {scenes.map((group) => {
                const active = group.scene!.id === activeSceneId
                const label = `Cảnh ${group.number}. ${group.scene!.text || 'Chưa đặt bối cảnh'}`
                return (
                  <button
                    aria-current={active ? 'location' : undefined}
                    className={cn(
                      'h-8 max-w-[220px] shrink-0 truncate rounded-full border px-3 text-[12.5px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#39b536]',
                      active ? 'border-[#39b536] bg-[#f3faf2] font-semibold text-[#2f9a2d]' : 'border-[#e5e7eb] bg-white text-[#374151] hover:border-[#b9e3b6]',
                    )}
                    key={group.scene!.id}
                    onClick={() => onJumpToScene(group.scene!.id)}
                    title={label}
                    type="button"
                  >
                    {label}
                  </button>
                )
              })}
            </nav>
          </>
        )}
      </div>
    </div>
  )
}
