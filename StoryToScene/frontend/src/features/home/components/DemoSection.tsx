import type { ReactNode } from 'react'
import { ArrowRight, BookOpen, Clapperboard, ScanText, Sparkles, Zap, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { sectionIds, siteLinks } from '@/config/site-links'
import { cn } from '@/lib/utils'
import { demoEvents, demoScreenplay as sp, demoStory } from '../data/home-content'
import { ScreenplayPreview } from './ScreenplayPreview'
import { ActionLink } from './shared/ActionLink'
import { Section } from './shared/Section'
import { SectionHeader } from './shared/SectionHeader'

/* --------------------------- Stepper chip --------------------------- */

const pipeline = [
  { label: 'Truyện gốc', dot: 'bg-ink-muted', chip: 'bg-surface text-ink' },
  { label: 'AI rút sự kiện', dot: 'bg-brand-mid', chip: 'bg-surface text-ink' },
  { label: 'Kịch bản chuẩn', dot: 'bg-brand-deep', chip: 'bg-peach text-brand-deep' },
]

function PipelineStepper() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-2" aria-label="Các bước chuyển đổi">
        {pipeline.map((step, i) => (
          <li key={step.label} className="flex items-center gap-3">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-sm px-3 py-1 text-sm leading-5 font-semibold tracking-[0.01em]',
                step.chip,
              )}
            >
              <span aria-hidden="true" className={cn('size-2 rounded-full', step.dot)} />
              {step.label}
            </span>
            {i < pipeline.length - 1 && (
              <ArrowRight aria-hidden="true" className="size-3 text-ink-muted" strokeWidth={2.5} />
            )}
          </li>
        ))}
      </ol>
      <p className="text-[13px] leading-[18px] font-semibold tracking-[0.05em] text-clay">
        ĐỊNH DẠNG CHUẨN HOLLYWOOD
      </p>
    </div>
  )
}

/* ---------------------------- Step panel ---------------------------- */

type StepPanelProps = {
  icon: LucideIcon
  label: string
  labelClassName: string
  aside: ReactNode
  title?: string
  footer: ReactNode
  elevated?: boolean
  children: ReactNode
}

function StepPanel({ icon: Icon, label, labelClassName, aside, title, footer, elevated, children }: StepPanelProps) {
  return (
    <article
      className={cn(
        'flex flex-col rounded-xl p-5 sm:p-6',
        elevated ? 'bg-white shadow-md ring-1 ring-black/[0.03]' : 'bg-surface',
      )}
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <span className={cn('inline-flex items-center gap-2', labelClassName)}>
          <Icon aria-hidden="true" className="size-4" strokeWidth={2.25} />
          <span className="text-xs leading-4 font-semibold tracking-[0.05em] uppercase">{label}</span>
        </span>
        {aside}
      </header>
      {title && <h3 className="mb-3 text-xl leading-7 font-semibold text-ink">{title}</h3>}
      <div className="flex-1">{children}</div>
      <footer className="mt-6 flex items-center justify-between gap-3 pt-0 lg:mt-auto lg:pt-6">{footer}</footer>
    </article>
  )
}

const footNote = 'text-xs leading-4 font-semibold tracking-[0.04em] text-ink-muted'

/* ------------------------------ Section ----------------------------- */

export function DemoSection() {
  return (
    <Section id={sectionIds.demo} aria-labelledby="demo-title">
      <SectionHeader
        id="demo-title"
        eyebrow="Trực quan hóa"
        title="Dán truyện vào, nhận lại kịch bản"
        description="Xem tiến trình chuyển đổi từng bước từ trang văn xuôi sang định dạng kịch bản Hollywood thực thụ."
      />

      <div className="mt-10 flex flex-col gap-6 rounded-2xl bg-white p-4 shadow-xl sm:p-6 lg:mt-16 lg:p-10">
        <PipelineStepper />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Bước 1 */}
          <StepPanel
            icon={BookOpen}
            label="Bước 1 · Truyện gốc"
            labelClassName="text-ink-muted"
            aside={<span className="text-xs leading-4 text-ink-muted">{demoStory.chapter}</span>}
            title={demoStory.title}
            footer={
              <>
                <span className={footNote}>{demoStory.wordCount}</span>
                <Zap aria-hidden="true" className="size-3.5 fill-brand-deep text-brand-deep" />
              </>
            }
          >
            <div className="space-y-3 text-[15px] leading-[24.4px] text-ink/90">
              <p>{demoStory.before}</p>
              <blockquote className="rounded-lg bg-white p-3 text-ink-muted italic">{demoStory.quote}</blockquote>
              <p>{demoStory.after}</p>
            </div>
          </StepPanel>

          {/* Bước 2 */}
          <StepPanel
            icon={ScanText}
            label="Bước 2 · AI bóc tách"
            labelClassName="text-brand-mid"
            aside={
              <Badge variant="white" shape="compact" className="font-normal tracking-normal">
                {demoEvents.length} Sự kiện chính
              </Badge>
            }
            title="Bóc tách nhịp phim"
            footer={
              <>
                <span className={footNote}>Tối ưu hóa cốt truyện</span>
                <Sparkles aria-hidden="true" className="size-4 text-brand-mid" />
              </>
            }
          >
            <ol className="flex flex-col gap-3">
              {demoEvents.map((event, i) => (
                <li key={event.title} className="flex flex-col gap-1 rounded-lg bg-white p-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface text-xs leading-4 font-semibold text-brand-deep"
                    >
                      {i + 1}
                    </span>
                    <span className="text-xs leading-4 font-semibold tracking-[0.04em] text-ink">{event.title}</span>
                  </div>
                  <p className="pl-7 text-[13px] leading-5 text-ink-muted">{event.detail}</p>
                </li>
              ))}
            </ol>
          </StepPanel>

          {/* Bước 3 */}
          <StepPanel
            elevated
            icon={Clapperboard}
            label="Bước 3 · Kịch bản"
            labelClassName="text-brand-deep"
            aside={
              <Badge variant="accent" shape="compact" className="font-semibold tracking-normal">
                Chuẩn Slugline
              </Badge>
            }
            footer={
              <>
                <span className={footNote}>{sp.estimate}</span>
                <ActionLink
                  href={siteLinks.studio}
                  unavailableLabel="Studio sắp ra mắt"
                  className="inline-flex items-center gap-1 text-xs leading-4 font-semibold tracking-[0.04em] text-brand-deep hover:underline"
                >
                  Mở trong Studio
                  <ArrowRight aria-hidden="true" className="size-3" strokeWidth={2.5} />
                </ActionLink>
              </>
            }
          >
            <ScreenplayPreview />
          </StepPanel>
        </div>
      </div>
    </Section>
  )
}
