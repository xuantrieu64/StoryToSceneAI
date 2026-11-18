import { useEffect, useState, type FormEvent } from 'react'
import {
  findOptionName,
  settingFields,
  storyGenres,
  visualStyles,
  type CatalogOption,
} from '../data/project-catalog'
import {
  PROJECT_NAME_MAX_LENGTH,
  type AiLanguage,
  type AspectRatio,
  type CreateProjectInput,
  type ProjectSetting,
  type ProjectSettingKey,
  type ProjectType,
  type StoryGenreId,
  type VisualStyleId,
} from '../types/project'

export type ProjectFormMode = 'create' | 'edit'

type FormCreateStoryProps = {
  isOpen: boolean
  /** 'create' = tạo dự án mới; 'edit' = chỉnh sửa dự án có sẵn (cần `initialValues`). */
  mode?: ProjectFormMode
  /** Dữ liệu đã lưu để điền sẵn vào form (chế độ chỉnh sửa). */
  initialValues?: CreateProjectInput
  onClose: () => void
  onSubmit: (input: CreateProjectInput) => void
}

type TabName = 'style' | 'story' | 'context'

const tabs: { id: TabName; label: string }[] = [
  { id: 'style', label: 'Phong cách hình ảnh' },
  { id: 'story', label: 'Thể loại truyện' },
  { id: 'context', label: 'Bối cảnh' },
]

/**
 * Modal tạo mới / chỉnh sửa dự án. Phần nội dung chỉ được mount khi mở,
 * nên mỗi lần mở lại form đều bắt đầu từ dữ liệu trống (tạo mới) hoặc
 * từ dữ liệu đã lưu (chỉnh sửa) – thay đổi chưa lưu sẽ bị bỏ khi đóng.
 */
export function FormCreateStory({ isOpen, mode = 'create', initialValues, onClose, onSubmit }: FormCreateStoryProps) {
  if (!isOpen) return null
  return <CreateStoryDialog initialValues={initialValues} mode={mode} onClose={onClose} onSubmit={onSubmit} />
}

/** Bỏ khoảng trắng; trả về null nếu rỗng. */
function cleanText(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function buildSetting(values: Record<ProjectSettingKey, string>): ProjectSetting | null {
  const setting: ProjectSetting = {}
  for (const { key } of settingFields) {
    const value = cleanText(values[key])
    if (value) setting[key] = value
  }
  return Object.keys(setting).length > 0 ? setting : null
}

const emptySetting = Object.fromEntries(settingFields.map(({ key }) => [key, ''])) as Record<
  ProjectSettingKey,
  string
>

function toSettingValues(setting: ProjectSetting | null | undefined): Record<ProjectSettingKey, string> {
  return { ...emptySetting, ...setting }
}

function CreateStoryDialog({
  initialValues,
  mode,
  onClose,
  onSubmit,
}: Omit<FormCreateStoryProps, 'isOpen' | 'mode'> & { mode: ProjectFormMode }) {
  const isEdit = mode === 'edit'
  const [projectName, setProjectName] = useState(initialValues?.name ?? '')
  const [genreNote, setGenreNote] = useState(initialValues?.genreNote ?? '')
  const [projectType, setProjectType] = useState<ProjectType>(initialValues?.type ?? 'novel')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(initialValues?.aspectRatio ?? '16:9')
  const [aiLanguage, setAiLanguage] = useState<AiLanguage>(initialValues?.aiLanguage ?? 'vi')
  const [activeTab, setActiveTab] = useState<TabName>('style')
  const [visualStyleId, setVisualStyleId] = useState<VisualStyleId | null>(initialValues?.visualStyleId ?? null)
  const [storyGenreId, setStoryGenreId] = useState<StoryGenreId | null>(initialValues?.storyGenreId ?? null)
  const [setting, setSetting] = useState<Record<ProjectSettingKey, string>>(() => toSettingValues(initialValues?.setting))

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = cleanText(projectName)
    if (!name) return

    onSubmit({
      name: name.slice(0, PROJECT_NAME_MAX_LENGTH),
      type: projectType,
      genreNote: cleanText(genreNote),
      storyGenreId,
      visualStyleId,
      aspectRatio,
      aiLanguage,
      setting: buildSetting(setting),
    })
  }

  const settingConfigured = buildSetting(setting) !== null
  const styleName = findOptionName(visualStyles, visualStyleId)
  const genreName = findOptionName(storyGenres, storyGenreId)

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-900/20 p-3 sm:p-6 max-[760px]:p-0"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        aria-labelledby="create-story-title"
        aria-modal="true"
        className="flex h-[min(650px,calc(100vh-24px))] w-full max-w-[954px] flex-col overflow-hidden rounded-2xl border border-[rgba(226,232,240,0.8)] bg-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] max-[760px]:h-[100dvh] max-[760px]:max-h-[100dvh] max-[760px]:rounded-none"
        data-node-id="58:155"
        role="dialog"
      >
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={submitProject}>
          <header className="flex min-h-[85px] shrink-0 items-start justify-between gap-5 border-b border-[#f1f5f9] px-6 pb-[17px] pt-6 max-[760px]:px-[18px] max-[760px]:py-4">
            <div>
              <h2
                className="m-0 text-[22px] font-bold leading-[33px] tracking-[-0.55px] text-[#0f172a] max-[760px]:text-xl"
                id="create-story-title"
              >
                {isEdit ? 'Chỉnh sửa dự án' : 'Dự án mới'}
              </h2>
              <p className="mb-0 mt-1 text-xs leading-4 text-[#64748b] max-[760px]:max-w-[520px] max-[760px]:leading-[18px]">
                Điền thông tin truyện, rồi chọn phong cách hình ảnh và thể loại truyện để AI bám theo.
              </p>
            </div>
            <button
              aria-label="Đóng"
              className="grid size-8 shrink-0 place-items-center rounded-lg p-1.5 text-[#94a3b8] hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536]"
              onClick={onClose}
              type="button"
            >
              <CloseIcon />
            </button>
          </header>

          <div className="grid min-h-0 flex-1 grid-cols-[minmax(280px,1fr)_minmax(0,2fr)] max-[760px]:flex max-[760px]:flex-col max-[760px]:overflow-y-auto">
            <section
              aria-label="Thông tin dự án"
              className="flex min-h-0 flex-col gap-5 overflow-y-auto p-6 max-[1000px]:px-[18px] max-[760px]:shrink-0 max-[760px]:overflow-visible max-[760px]:p-[18px]"
            >
              <div className="flex flex-col gap-2">
                <FieldLabel>Loại dự án</FieldLabel>
                <SegmentedControl
                  onChange={setProjectType}
                  options={[
                    { label: 'Từ tiểu thuyết', value: 'novel' },
                    { label: 'Từ kịch bản', value: 'script' },
                  ]}
                  selected={projectType}
                />
              </div>

              <TextField
                label="Tên dự án"
                maxLength={PROJECT_NAME_MAX_LENGTH}
                onChange={setProjectName}
                placeholder="Tên hiện trong danh sách dự án"
                required
                value={projectName}
              />
              <TextField
                label="Ghi chú thể loại"
                onChange={setGenreNote}
                placeholder="Ví dụ: Huyền huyễn, Khoa học viễn tưởng..."
                value={genreNote}
              />

              <div className="flex flex-col gap-2">
                <FieldLabel>Tỷ lệ video</FieldLabel>
                <div className="grid grid-cols-2 gap-2.5">
                  <RatioOption
                    active={aspectRatio === '16:9'}
                    label="16:9 ngang"
                    orientation="landscape"
                    onClick={() => setAspectRatio('16:9')}
                  />
                  <RatioOption
                    active={aspectRatio === '9:16'}
                    label="9:16 dọc"
                    orientation="portrait"
                    onClick={() => setAspectRatio('9:16')}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-[7px]">
                <FieldLabel>Ngôn ngữ AI viết</FieldLabel>
                <SegmentedControl
                  onChange={setAiLanguage}
                  options={[
                    { label: 'Tiếng Việt', value: 'vi' },
                    { label: 'Tiếng Anh', value: 'en' },
                  ]}
                  selected={aiLanguage}
                />
                <p className="mb-0 mt-0.5 text-[11px] leading-[17.88px] text-[#94a3b8]">
                  Đổi ngôn ngữ không dịch lại phần đã viết; lượt AI đang chạy giữ ngôn ngữ cũ.
                </p>
              </div>
            </section>

            <section
              aria-label="Phong cách, thể loại và bối cảnh"
              className="flex min-h-0 min-w-0 flex-col overflow-hidden border-l border-[#f1f5f9] px-6 py-6 max-[1000px]:px-[18px] max-[760px]:min-h-[550px] max-[760px]:shrink-0 max-[760px]:overflow-visible max-[760px]:border-l-0 max-[760px]:border-t max-[760px]:p-[18px]"
            >
              <div aria-label="Tùy chọn dự án" className="flex min-h-[31px] shrink-0 items-stretch" role="tablist">
                {tabs.map((tab) => (
                  <TabButton active={activeTab === tab.id} id={tab.id} key={tab.id} onClick={() => setActiveTab(tab.id)}>
                    {tab.label}
                  </TabButton>
                ))}
              </div>

              {activeTab === 'context' ? (
                <ContextPanel
                  values={setting}
                  onChange={(key, value) => setSetting((current) => ({ ...current, [key]: value }))}
                />
              ) : activeTab === 'style' ? (
                <OptionPanel
                  onSelect={setVisualStyleId}
                  options={visualStyles}
                  selectedId={visualStyleId}
                  tab="style"
                />
              ) : (
                <OptionPanel
                  onSelect={setStoryGenreId}
                  options={storyGenres}
                  selectedId={storyGenreId}
                  tab="story"
                />
              )}
            </section>
          </div>

          <footer className="flex min-h-[58px] shrink-0 items-center justify-between gap-5 border-t border-[#f1f5f9] bg-white px-7 py-3 max-[1000px]:gap-3 max-[760px]:items-end max-[760px]:px-4 max-[760px]:py-2.5 max-[520px]:items-center max-[520px]:gap-2">
            <div aria-live="polite" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs leading-4 max-[1000px]:gap-x-2.5 max-[1000px]:text-[11px] max-[760px]:max-w-[55%] max-[760px]:flex-col max-[760px]:items-start max-[760px]:gap-y-0">
              <SummaryItem label="Phong cách" value={styleName ?? 'AI tự quyết'} />
              <SummaryItem label="Thể loại" value={genreName ?? 'AI tự quyết'} />
              <SummaryItem label="Bối cảnh" value={settingConfigured ? 'Đã tùy chỉnh' : 'AI theo truyện'} />
            </div>
            <div className="flex shrink-0 items-center gap-3 max-[520px]:gap-1.5">
              <button
                className="min-h-[34px] rounded-lg border border-[#e2e8f0] bg-white px-[21px] py-2 text-xs leading-4 text-[#334155] hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536] max-[520px]:px-2.5"
                onClick={onClose}
                type="button"
              >
                Hủy
              </button>
              <button
                className="min-h-[34px] rounded-lg bg-[#39b536] px-6 py-2 text-xs font-bold leading-4 text-white shadow-sm hover:bg-[#32a92f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#198c22] max-[520px]:px-2.5"
                type="submit"
              >
                {isEdit ? 'Lưu thay đổi' : 'Tạo dự án'}
              </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  )
}

function FieldLabel({ children }: { children: string }) {
  return <span className="text-xs font-bold leading-4 text-[#334155]">{children}</span>
}

type SegmentedOption<Value extends string> = {
  label: string
  value: Value
}

type SegmentedControlProps<Value extends string> = {
  onChange: (value: Value) => void
  options: SegmentedOption<Value>[]
  selected: Value
}

function SegmentedControl<Value extends string>({ onChange, options, selected }: SegmentedControlProps<Value>) {
  return (
    <div className="flex gap-1 rounded-lg border border-[rgba(226,232,240,0.6)] bg-[rgba(241,245,249,0.9)] p-[5px]">
      {options.map((option) => (
        <button
          aria-pressed={selected === option.value}
          className={`min-h-[30px] min-w-0 flex-1 rounded-md border px-2 py-1.5 text-xs leading-4 ${
            selected === option.value
              ? 'border-[#39b536] bg-white font-bold text-[#006c0c] shadow-sm'
              : 'border-transparent bg-transparent text-[#475569] hover:bg-white/60'
          }`}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

type TextFieldProps = {
  label: string
  maxLength?: number
  onChange: (value: string) => void
  placeholder: string
  required?: boolean
  value: string
}

function TextField({ label, maxLength, onChange, placeholder, required = false, value }: TextFieldProps) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      <input
        className="h-9 w-full min-w-0 rounded-lg border border-[#e2e8f0] bg-white px-[13px] text-xs leading-4 text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:border-[#39b536] focus:ring-2 focus:ring-[#39b536]/15"
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        value={value}
      />
    </label>
  )
}

type RatioOptionProps = {
  active: boolean
  label: string
  onClick: () => void
  orientation: 'landscape' | 'portrait'
}

function RatioOption({ active, label, onClick, orientation }: RatioOptionProps) {
  return (
    <button
      aria-pressed={active}
      className={`flex min-h-[38px] min-w-0 items-center justify-center gap-2 rounded-lg border px-2 py-2 text-xs ${
        active
          ? 'border-[#39b536] bg-[#eff6e7] font-bold text-[#1e293b] shadow-sm'
          : 'border-[#e2e8f0] bg-white text-[#475569] hover:bg-slate-50'
      }`}
      onClick={onClick}
      type="button"
    >
      <span
        aria-hidden="true"
        className={`rounded-[2px] border-2 ${orientation === 'landscape' ? 'h-[10px] w-4' : 'h-4 w-[10px]'} ${
          active ? 'border-[#39b536]' : 'border-[#64748b]'
        }`}
      />
      {label}
    </button>
  )
}

type TabButtonProps = {
  active: boolean
  children: string
  id: TabName
  onClick: () => void
}

function TabButton({ active, children, id, onClick }: TabButtonProps) {
  return (
    <button
      aria-controls="create-story-options"
      aria-selected={active}
      className={`relative inline-flex min-h-[31px] shrink-0 items-center justify-center px-[14px] pb-2 text-xs ${
        active ? 'text-black' : 'text-[#949494] hover:text-[#4b5563]'
      }`}
      id={`create-story-tab-${id}`}
      onClick={onClick}
      role="tab"
      type="button"
    >
      {children}
      {active && <span className="absolute bottom-0 left-[14px] right-[14px] h-1 rounded-sm bg-[#5ae66f]" />}
    </button>
  )
}

type OptionPanelProps<Id extends string> = {
  onSelect: (id: Id | null) => void
  options: CatalogOption<Id>[]
  selectedId: Id | null
  tab: TabName
}

/** Lưới thẻ lựa chọn; bấm lại thẻ đang chọn để bỏ chọn (về null = AI tự quyết). */
function OptionPanel<Id extends string>({ onSelect, options, selectedId, tab }: OptionPanelProps<Id>) {
  return (
    <div
      aria-labelledby={`create-story-tab-${tab}`}
      className="flex min-h-0 flex-1 flex-col max-[760px]:flex-none"
      id="create-story-options"
      role="tabpanel"
    >
      <p className="mb-0 shrink-0 pb-[14px] pt-[2px] text-[11px] leading-[16.5px] text-[#64748b]">
        Không chọn thì AI tự quyết. Bấm lại thẻ đang chọn để bỏ chọn.
      </p>
      {/*
        Lớp ngoài lo cuộn; lưới bên trong có chiều cao tự do nên `auto-rows-fr`
        cho mọi hàng cao bằng thẻ có nội dung dài nhất → thẻ đồng đều, không cắt chữ.
      */}
      <div className="min-h-0 flex-1 overflow-y-auto pr-1 max-[760px]:flex-none">
        <div className="grid auto-rows-fr grid-cols-3 gap-[14px] max-[1000px]:gap-2.5 max-[760px]:grid-cols-2">
          {options.map((option) => (
            <OptionCard
              key={option.id}
              option={option}
              selected={selectedId === option.id}
              onClick={() => onSelect(selectedId === option.id ? null : option.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

type OptionCardProps = {
  onClick: () => void
  option: CatalogOption<string>
  selected: boolean
}

function OptionCard({ onClick, option, selected }: OptionCardProps) {
  return (
    <button
      aria-pressed={selected}
      className={`flex min-w-0 flex-col overflow-hidden rounded-xl bg-white text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536] ${
        selected ? 'border-2 border-[#39b536] p-0.5' : 'border border-[#e2e8f0] p-px hover:border-[#9bd998]'
      }`}
      onClick={onClick}
      type="button"
    >
      <img alt="" className="h-[102px] w-full shrink-0 object-cover" src={option.image} />
      <span className="flex flex-1 flex-col gap-1 p-2.5">
        <strong className="text-xs font-bold leading-[16.5px] text-[#1e293b]">
          {option.name}
        </strong>
        <span className="text-[10.5px] leading-[17px] text-[#94a3b8]">
          {option.description}
        </span>
      </span>
    </button>
  )
}

type ContextPanelProps = {
  onChange: (key: ProjectSettingKey, value: string) => void
  values: Record<ProjectSettingKey, string>
}

function ContextPanel({ onChange, values }: ContextPanelProps) {
  return (
    <div
      aria-labelledby="create-story-tab-context"
      className="min-h-0 flex-1 overflow-y-auto pt-2 max-[760px]:flex-none"
      id="create-story-options"
      role="tabpanel"
    >
      <p className="mb-0 text-xs leading-[19.5px] text-[#4b5563]">
        Truyện diễn ra ở đâu, thời nào, người và cảnh ra sao. Điền 8 ô ngắn (hoặc để AI đề xuất rồi sửa): kịch bản,
        phân cảnh và mọi hình ảnh sẽ bám theo đúng bối cảnh này. Để trống = AI tự theo truyện, không gắn nước nào.
      </p>
      <p className="mb-0 mt-1 border-b border-transparent pb-[14px] text-xs leading-[19.5px] text-[#6b7280]">
        Tạo dự án và nhập truyện xong, vào Sửa dự án để AI đề xuất bối cảnh từ truyện (trừ 1 lượt chữ).
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-[14px] pt-1 max-[520px]:grid-cols-1">
        {settingFields.map((field) => (
          <TextField
            key={field.key}
            label={field.label}
            onChange={(value) => onChange(field.key, value)}
            placeholder={field.placeholder}
            value={values[field.key]}
          />
        ))}
      </div>
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <span className="whitespace-nowrap text-[#94a3b8]">
      {label}: <strong className="font-normal text-[#1e293b]">{value}</strong>
    </span>
  )
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}
