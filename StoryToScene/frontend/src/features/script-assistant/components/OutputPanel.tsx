import { PackageOpen } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { outputTabs, type OutputTabId } from '../data/output-tabs'

type OutputPanelProps = {
  activeTab: OutputTabId
  onTabChange: (tab: OutputTabId) => void
}

/** Cột phải: tab Khung truyện / Chiến lược chuyển thể / Kịch bản, nút Chỉnh sửa, vùng nội dung. */
export function OutputPanel({ activeTab, onTabChange }: OutputPanelProps) {
  return (
    <section aria-label="Kết quả" className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-end justify-between gap-4 border-b border-[#eceef1]">
        <div aria-label="Nội dung kết quả" className="-mb-px flex gap-10 overflow-x-auto max-[1100px]:gap-6" role="tablist">
          {outputTabs.map((tab) => {
            const selected = tab.id === activeTab
            return (
              <button
                aria-controls={`script-output-${tab.id}`}
                aria-selected={selected}
                className={cn(
                  'shrink-0 whitespace-nowrap border-b-[3px] pb-3.5 pt-1 text-[15px] leading-6 transition-colors',
                  selected ? 'border-[#39b536] font-semibold text-[#111827]' : 'border-transparent text-[#6b7280] hover:text-[#374151]',
                )}
                id={`script-tab-${tab.id}`}
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                role="tab"
                type="button"
              >
                {tab.label}
              </button>
            )
          })}
        </div>
        <button
          className="mb-3 inline-flex h-9 shrink-0 items-center rounded-md bg-[#39b536] px-5 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-[#32a92f]"
          onClick={() => toast.info('Chưa có nội dung để chỉnh sửa')}
          type="button"
        >
          Chỉnh sửa
        </button>
      </div>

      <div
        aria-labelledby={`script-tab-${activeTab}`}
        className="grid flex-1 place-items-center py-10"
        id={`script-output-${activeTab}`}
        role="tabpanel"
      >
        <div className="flex flex-col items-center text-center">
          <PackageOpen aria-hidden="true" className="size-11 text-[#9ca3af]" strokeWidth={1.3} />
          <p className="m-0 mt-3 text-[13px] leading-5 text-[#9ca3af]">Chưa có nội dung</p>
        </div>
      </div>
    </section>
  )
}
