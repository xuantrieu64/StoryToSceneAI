import { Download, FileCheck2, Video } from 'lucide-react'
import { sectionIds } from '@/config/site-links'
import { cn } from '@/lib/utils'
import { steps } from '../data/home-content'
import { Container } from './shared/Container'
import { SectionHeading } from './shared/SectionHeading'

const stepIcons = { file: FileCheck2, camera: Video, download: Download }

export function StepsSection() {
  return (
    <section id={sectionIds.steps} aria-labelledby="steps-title" className="bg-white py-16 lg:py-24">
      <Container>
        <SectionHeading id="steps-title" layout="left" eyebrow="Tối ưu hóa thời gian sản xuất" title="Từ truyện đến kịch bản trong 3 bước" />
        <ol className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3 lg:mt-12 lg:gap-8">
          {steps.map((step) => {
            const Icon = stepIcons[step.icon]
            return (
              <li
                key={step.number}
                className="group flex flex-col rounded-2xl border border-slate-200/70 bg-slate-50 p-6 transition-colors hover:border-jade-200 lg:p-8"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'text-[32px] leading-10 font-semibold tabular-nums transition-colors',
                    step.active ? 'text-jade-500' : 'text-slate-300 group-hover:text-jade-500',
                  )}
                >
                  {step.number}
                </span>
                <h3 className="mt-4 text-lg leading-6 font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 flex-1 text-[13px] leading-6 text-slate-500">{step.description}</p>
                <p className="mt-5 flex items-center gap-2 text-xs leading-4 font-medium text-jade-600">
                  <Icon aria-hidden="true" className="size-3.5" />
                  {step.note}
                </p>
              </li>
            )
          })}
        </ol>
      </Container>
    </section>
  )
}
