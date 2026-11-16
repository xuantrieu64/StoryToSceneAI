import { useEffect, useState, type FormEvent } from 'react'

type FormCreateStoryProps = {
  isOpen: boolean
  onClose: () => void
  onCreate: (projectName: string) => void
}

type TabName = 'style' | 'story' | 'context'
type ProjectType = 'novel' | 'script'

type StyleOption = {
  name: string
  description: string
  image: string
}

const styleOptions: StyleOption[] = [
  {
    name: 'Hoạt hình Nhật thập niên 90',
    description: 'Hoạt hình 2D hoài niệm lấy cảm hứng từ anime Nhật Bản thập niên 1990; bối cảnh theo truyện.',
    image: '/assets/story-styles/anime-90s.png',
  },
  {
    name: '2D cổ phong Trung Hoa',
    description: 'Hoạt hình 2D cổ phong, kết hợp mỹ học phương Đông và màu sắc hiện đại.',
    image: '/assets/story-styles/chinese-classic.png',
  },
  {
    name: '2D phẳng tối giản',
    description: 'Minh họa 2D phẳng, hình khối rõ ràng và màu sắc gọn; bối cảnh theo truyện.',
    image: '/assets/story-styles/flat-2d.png',
  },
  {
    name: 'Đô thị điện ảnh',
    description: 'Phong cách điện ảnh hiện đại với ánh sáng đèn đô thị và tông màu cảm xúc sâu lắng.',
    image: '/assets/story-styles/urban-cinema.png',
  },
  {
    name: 'Tranh dân gian truyền thống',
    description: 'Màu sắc kinh điển, nét vẽ mực truyền thống gợi mở không gian thi vị cổ điển.',
    image: '/assets/story-styles/traditional-ink.png',
  },
  {
    name: 'Huyền ảo điện ảnh',
    description: 'Tông màu rực rỡ, trang phục tỉ mỉ và khung cảnh lộng lẫy mang chất tiên hiệp.',
    image: '/assets/story-styles/fantasy-cinema.png',
  },
]

const contextFields = [
  { label: 'Thời đại', placeholder: 'vd. Hiện đại, 2020s · Thế kỷ 18 thờ...' },
  { label: 'Nơi chốn', placeholder: 'vd. TP.HCM, Việt Nam · Kinh thành...' },
  { label: 'Con người', placeholder: 'vd. Người Việt; da, tóc, dáng theo ...' },
  { label: 'Trang phục', placeholder: 'vd. Đồ công sở, áo thun · Áo tứ thâ...' },
  { label: 'Kiến trúc, đường phố', placeholder: 'vd. Nhà ống, hẻm, xe máy, cà phê ...' },
  { label: 'Chữ trên biển hiệu', placeholder: 'vd. Tiếng Việt · Không có chữ đọc ...' },
  { label: 'Chi tiết đời sống', placeholder: 'vd. Tiền đồng, phở, trà đá · Trầu c...' },
  { label: 'Không được xuất hiện', placeholder: 'vd. Biển hiệu chữ Hán, đèn lồng đỏ...' },
]

export function FormCreateStory({ isOpen, onClose, onCreate }: FormCreateStoryProps) {
  const [projectName, setProjectName] = useState('')
  const [genre, setGenre] = useState('')
  const [projectType, setProjectType] = useState<ProjectType>('novel')
  const [videoRatio, setVideoRatio] = useState<'landscape' | 'portrait'>('landscape')
  const [language, setLanguage] = useState<'vi' | 'en'>('vi')
  const [activeTab, setActiveTab] = useState<TabName>('style')
  const [selectedStyle, setSelectedStyle] = useState<string | null>('Hoạt hình Nhật thập niên 90')
  const [selectedStoryType, setSelectedStoryType] = useState<string | null>(null)
  const [context, setContext] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  function submitProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = projectName.trim()
    if (trimmedName) onCreate(trimmedName)
  }

  const contextConfigured = Object.values(context).some((value) => value.trim().length > 0)
  const selection = activeTab === 'style' ? selectedStyle : selectedStoryType

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
                Dự án mới
              </h2>
              <p className="mb-0 mt-1 text-xs leading-4 text-[#64748b] max-[760px]:max-w-[520px] max-[760px]:leading-[18px]">
                Điền thông tin truyện, rồi chọn phong cách hình ảnh và thể loại kể chuyện để AI bám theo.
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
                  onChange={(value) => setProjectType(value as ProjectType)}
                  options={[
                    { label: 'Từ tiểu thuyết', value: 'novel' },
                    { label: 'Từ kịch bản', value: 'script' },
                  ]}
                  selected={projectType}
                />
              </div>

              <TextField
                label="Tên dự án"
                onChange={setProjectName}
                placeholder="Tên hiện trong danh sách dự án"
                required
                value={projectName}
              />
              <TextField
                label={projectType === 'novel' ? 'Thể loại tiểu thuyết' : 'Thể loại kịch bản'}
                onChange={setGenre}
                placeholder="Ví dụ: Huyền huyễn, Khoa học viễn tưởng..."
                value={genre}
              />

              <div className="flex flex-col gap-2">
                <FieldLabel>Tỷ lệ video</FieldLabel>
                <div className="grid grid-cols-2 gap-2.5">
                  <RatioOption
                    active={videoRatio === 'landscape'}
                    label="16:9 ngang"
                    orientation="landscape"
                    onClick={() => setVideoRatio('landscape')}
                  />
                  <RatioOption
                    active={videoRatio === 'portrait'}
                    label="9:16 dọc"
                    orientation="portrait"
                    onClick={() => setVideoRatio('portrait')}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-[7px]">
                <FieldLabel>Ngôn ngữ AI viết</FieldLabel>
                <SegmentedControl
                  onChange={(value) => setLanguage(value as 'vi' | 'en')}
                  options={[
                    { label: 'Tiếng Việt', value: 'vi' },
                    { label: 'Tiếng Anh', value: 'en' },
                  ]}
                  selected={language}
                />
                <p className="mb-0 mt-0.5 text-[11px] leading-[17.88px] text-[#94a3b8]">
                  Đổi ngôn ngữ không dịch lại phần đã viết; lượt AI đang chạy giữ ngôn ngữ cũ.
                </p>
              </div>
            </section>

            <section
              aria-label="Phong cách và bối cảnh"
              className="flex min-h-0 min-w-0 flex-col overflow-hidden border-l border-[#f1f5f9] px-6 py-6 max-[1000px]:px-[18px] max-[760px]:min-h-[550px] max-[760px]:shrink-0 max-[760px]:overflow-visible max-[760px]:border-l-0 max-[760px]:border-t max-[760px]:p-[18px]"
            >
              <div aria-label="Tùy chọn dự án" className="flex min-h-[31px] shrink-0 items-stretch" role="tablist">
                <TabButton active={activeTab === 'style'} onClick={() => setActiveTab('style')}>
                  Phong cảnh hình ảnh
                </TabButton>
                <TabButton active={activeTab === 'story'} onClick={() => setActiveTab('story')}>
                  Thể loại kể chuyện
                </TabButton>
                <TabButton active={activeTab === 'context'} onClick={() => setActiveTab('context')}>
                  Thể loại
                </TabButton>
              </div>

              {activeTab === 'context' ? (
                <ContextPanel
                  values={context}
                  onChange={(label, value) => setContext((current) => ({ ...current, [label]: value }))}
                />
              ) : (
                <div
                  aria-labelledby={`create-story-tab-${activeTab}`}
                  className="flex min-h-0 flex-1 flex-col max-[760px]:flex-none"
                  id="create-story-options"
                  role="tabpanel"
                >
                  <p className="mb-0 shrink-0 pb-[14px] pt-[2px] text-[11px] leading-[16.5px] text-[#64748b]">
                    Không chọn thì AI tự quyết. Bấm lại thẻ đang chọn để bỏ chọn.
                  </p>
                  <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-2 gap-[14px] overflow-y-auto pr-1 max-[1000px]:gap-2.5 max-[760px]:flex-none max-[760px]:grid-cols-2 max-[760px]:grid-rows-none max-[760px]:auto-rows-[205px]">
                    {styleOptions.map((option) => (
                      <StyleCard
                        key={`${activeTab}-${option.name}`}
                        option={option}
                        selected={selection === option.name}
                        onClick={() => {
                          const currentSelection = activeTab === 'style' ? selectedStyle : selectedStoryType
                          const nextSelection = currentSelection === option.name ? null : option.name
                          if (activeTab === 'style') setSelectedStyle(nextSelection)
                          else setSelectedStoryType(nextSelection)
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          <footer className="flex min-h-[58px] shrink-0 items-center justify-between gap-5 border-t border-[#f1f5f9] bg-white px-7 py-3 max-[1000px]:gap-3 max-[760px]:items-end max-[760px]:px-4 max-[760px]:py-2.5 max-[520px]:items-center max-[520px]:gap-2">
            <div aria-live="polite" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs leading-4 max-[1000px]:gap-x-2.5 max-[1000px]:text-[11px] max-[760px]:max-w-[55%] max-[760px]:flex-col max-[760px]:items-start max-[760px]:gap-y-0">
              <SummaryItem label="Phong cách" value={selectedStyle ?? 'AI tự quyết'} />
              <SummaryItem label="Thể loại" value={selectedStoryType ?? 'AI tự quyết'} />
              <SummaryItem label="Bối cảnh" value={contextConfigured ? 'Đã tùy chỉnh' : 'AI theo truyện'} />
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
                Tạo dự án
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

type SegmentedOption = {
  label: string
  value: string
}

type SegmentedControlProps = {
  onChange: (value: string) => void
  options: SegmentedOption[]
  selected: string
}

function SegmentedControl({ onChange, options, selected }: SegmentedControlProps) {
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
  onChange: (value: string) => void
  placeholder: string
  required?: boolean
  value: string
}

function TextField({ label, onChange, placeholder, required = false, value }: TextFieldProps) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      <input
        className="h-9 w-full min-w-0 rounded-lg border border-[#e2e8f0] bg-white px-[13px] text-xs leading-4 text-[#1e293b] outline-none placeholder:text-[#94a3b8] focus:border-[#39b536] focus:ring-2 focus:ring-[#39b536]/15"
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
  onClick: () => void
}

function TabButton({ active, children, onClick }: TabButtonProps) {
  return (
    <button
      aria-selected={active}
      className={`relative inline-flex min-h-[31px] shrink-0 items-center justify-center px-[14px] pb-2 text-xs ${
        active ? 'text-black' : 'text-[#949494] hover:text-[#4b5563]'
      }`}
      id={`create-story-tab-${children === 'Phong cảnh hình ảnh' ? 'style' : children === 'Thể loại kể chuyện' ? 'story' : 'context'}`}
      onClick={onClick}
      role="tab"
      type="button"
    >
      {children}
      {active && <span className="absolute bottom-0 left-[14px] right-[14px] h-1 rounded-sm bg-[#5ae66f]" />}
    </button>
  )
}

type StyleCardProps = {
  onClick: () => void
  option: StyleOption
  selected: boolean
}

function StyleCard({ onClick, option, selected }: StyleCardProps) {
  return (
    <button
      aria-pressed={selected}
      className={`flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl bg-white text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#39b536] ${
        selected ? 'border-2 border-[#39b536] p-0.5' : 'border border-[#e2e8f0] p-px hover:border-[#9bd998]'
      }`}
      onClick={onClick}
      type="button"
    >
      <img alt="" className="h-[102px] w-full shrink-0 object-cover" src={option.image} />
      <span className="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden p-2.5">
        <strong className="line-clamp-1 text-xs font-bold leading-[16.5px] text-[#1e293b]">
          {option.name}
        </strong>
        <span className="line-clamp-3 text-[10.5px] leading-[17px] text-[#94a3b8]">
          {option.description}
        </span>
      </span>
    </button>
  )
}

type ContextPanelProps = {
  onChange: (label: string, value: string) => void
  values: Record<string, string>
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
        {contextFields.map((field) => (
          <TextField
            key={field.label}
            label={field.label}
            onChange={(value) => onChange(field.label, value)}
            placeholder={field.placeholder}
            value={values[field.label] ?? ''}
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
