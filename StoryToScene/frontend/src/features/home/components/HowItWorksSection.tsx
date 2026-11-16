import { Check, Clapperboard, ClipboardList, Workflow, type LucideIcon } from 'lucide-react'
import { sectionIds } from '@/config/site-links'
import { CheckItem } from './shared/CheckItem'
import { IconTile } from './shared/IconTile'
import { Section } from './shared/Section'
import { SectionHeader } from './shared/SectionHeader'

type Step = {
  number: string
  title: string
  description: string
  note: string
  icon: LucideIcon
  tone: 'peach' | 'green'
  noteTone: 'green' | 'berry'
}

const steps: Step[] = [
  {
    number: '01',
    title: '1. Dán truyện',
    description:
      'Dán một chương hoặc toàn bộ cuốn tiểu thuyết của bạn. AI tự động nhận diện bố cục, phân tách các phân đoạn hợp lý.',
    note: 'Hỗ trợ file văn bản lên đến 50.000 từ',
    icon: ClipboardList,
    tone: 'peach',
    noteTone: 'green',
  },
  {
    number: '02',
    title: '2. AI rút sự kiện',
    description:
      'Mô hình ngôn ngữ điện ảnh tự động tìm chuỗi hành động cốt lõi, tâm lý nhân vật và bối cảnh không gian thời gian của từng chương.',
    note: 'Lọc bỏ các đoạn nội tâm dư thừa',
    icon: Workflow,
    tone: 'green',
    noteTone: 'berry',
  },
  {
    number: '03',
    title: '3. Nhận kịch bản',
    description:
      'Nhận kịch bản chia cảnh đúng định dạng phim ngắn chuyên nghiệp, tiếp tục chỉnh sửa, tạo storyboard và xuất bản trong Studio.',
    note: 'Xuất file PDF & Fountain linh hoạt',
    icon: Clapperboard,
    tone: 'peach',
    noteTone: 'green',
  },
]

export function HowItWorksSection() {
  return (
    <Section id={sectionIds.howItWorks} tone="surface" aria-labelledby="how-title">
      <SectionHeader
        id="how-title"
        eyebrow="Quy trình làm việc"
        title="Từ truyện đến kịch bản trong 3 bước"
        description="Quy trình tinh giản tối đa để nhà văn và người sáng tạo nội dung có ngay bản kịch bản hoàn chỉnh chỉ trong vài phút."
      />
      <ol className="mt-10 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 lg:mt-16">
        {steps.map((step) => (
          <li key={step.number} className="flex flex-col rounded-2xl bg-white p-6 shadow-xs md:p-8 lg:p-10">
            <div className="mb-6 flex items-center justify-between">
              <IconTile
                icon={step.icon}
                tone={step.tone}
                iconClassName={step.tone === 'green' ? 'text-berry' : undefined}
              />
              <span aria-hidden="true" className="text-xl leading-7 font-semibold text-ink-muted">
                {step.number}
              </span>
            </div>
            <h3 className="mb-2 text-xl leading-7 font-semibold text-ink">{step.title}</h3>
            <p className="mb-6 flex-1 text-[15px] leading-[24.4px] text-ink-muted">{step.description}</p>
            <CheckItem icon={Check} tone={step.noteTone}>
              {step.note}
            </CheckItem>
          </li>
        ))}
      </ol>
    </Section>
  )
}
