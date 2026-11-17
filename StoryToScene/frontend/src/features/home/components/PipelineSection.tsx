import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { sectionIds } from '@/config/site-links'
import { cn } from '@/lib/utils'
import { pipelineDemo as d } from '../data/home-content'
import { Container } from './shared/Container'
import { SectionHeading } from './shared/SectionHeading'

const stepLabel = 'text-[11px] leading-4 font-semibold tracking-[0.06em] uppercase'

type StageCardProps = {
  label: string
  tag: ReactNode
  footer: ReactNode
  highlighted?: boolean
  children: ReactNode
}

function StageCard({ label, tag, footer, highlighted, children }: StageCardProps) {
  return (
    <article
      className={cn(
        'flex h-full flex-col rounded-2xl border p-5 sm:p-6',
        highlighted ? 'border-jade-200 bg-jade-50/60 shadow-[0_10px_30px_-12px_rgb(0_176_116/0.35)]' : 'border-slate-200/80 bg-white',
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-slate-200/70 pb-4">
        <h3 className={cn(stepLabel, highlighted ? 'text-jade-600' : 'text-slate-500')}>{label}</h3>
        {tag}
      </header>
      <div className="flex-1 py-5">{children}</div>
      <footer className="flex items-center justify-between gap-3 border-t border-slate-200/70 pt-4">{footer}</footer>
    </article>
  )
}

/**
 * Mũi tên nối giữa các card. Bản thân phần tử này là khoảng cách 24px giữa 2 card
 * (desktop: cột rộng 24px, mobile: hàng cao 24px) và nút tròn nằm chính giữa,
 * nên không đè lên viền hay nội dung card.
 */
function Connector() {
  return (
    <div aria-hidden="true" className="flex h-6 shrink-0 items-center justify-center lg:h-auto lg:w-6">
      <span className="flex size-5 rotate-90 items-center justify-center rounded-full bg-jade-500 text-white shadow-sm lg:rotate-0">
        <ArrowRight className="size-3" strokeWidth={2.5} />
      </span>
    </div>
  )
}

const toneClass = { ink: 'text-slate-900', green: 'text-jade-600', red: 'rounded bg-rose-100 px-1.5 text-rose-600' }

export function PipelineSection() {
  return (
    <section id={sectionIds.pipeline} aria-labelledby="pipeline-title" className="border-y border-slate-100 bg-slate-50 py-16 lg:py-24">
      <Container>
        <SectionHeading
          id="pipeline-title"
          eyebrow="Quy trình biến đổi thông minh"
          title="Dán truyện vào, nhận lại kịch bản"
          description="Hệ thống phân tách ngữ nghĩa sâu sắc: nhận diện xung đột kịch bản, chuyển hóa đoạn văn miêu tả rườm rà thành chỉ dẫn máy quay súc tích."
        />

        <div className="mt-10 flex flex-col lg:mt-14 lg:flex-row lg:items-stretch">
          {/* Bước 1 */}
          <div className="min-w-0 lg:flex-1">
            <StageCard
              label="Bước 01 • Văn bản gốc"
              tag={<span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] leading-4 text-slate-500">Truyện chữ</span>}
              footer={
                <>
                  <span className="text-xs leading-4 text-slate-500">{d.sourceLength}</span>
                  <span className="text-xs leading-4 font-semibold text-jade-600">{d.sourceStatus}</span>
                </>
              }
            >
              <blockquote className="space-y-3 rounded-xl border border-slate-200/70 bg-slate-50 p-4 text-[13px] leading-6 text-slate-600 italic">
                {d.source.map((p) => (
                  <p key={p.slice(0, 20)}>{p}</p>
                ))}
              </blockquote>
            </StageCard>
          </div>

          <Connector />

          {/* Bước 2 */}
          <div className="min-w-0 lg:flex-1">
            <StageCard
              highlighted
              label="Bước 02 • Phân tích nhịp"
              tag={<span className="rounded-md bg-jade-100 px-2 py-0.5 text-[11px] leading-4 font-semibold text-jade-700">Auteur AI</span>}
              footer={
                <p className="w-full text-center text-xs leading-4 font-semibold tracking-[0.04em] text-jade-700 uppercase">
                  Sẵn sàng render kịch bản
                </p>
              }
            >
              <dl className="flex flex-col gap-2.5">
                {d.analysis.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/70 bg-white px-3.5 py-2.5">
                    <dt className={cn(stepLabel, 'text-slate-500')}>{row.label}:</dt>
                    <dd className={cn('text-right text-[11px] leading-5 font-semibold', toneClass[row.tone])}>{row.value}</dd>
                  </div>
                ))}
                <div className="rounded-lg border border-slate-200/70 bg-white px-3.5 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <dt className={cn(stepLabel, 'text-slate-500')}>Rà lọc thoại thừa:</dt>
                    <dd className="text-[11px] leading-5 font-semibold text-jade-600">ĐẠT {d.dialogueFilter}%</dd>
                  </div>
                  <div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-jade-500" style={{ width: `${d.dialogueFilter}%` }} />
                  </div>
                </div>
              </dl>
            </StageCard>
          </div>

          <Connector />

          {/* Bước 3 */}
          <div className="min-w-0 lg:flex-1">
            <StageCard
              label="Bước 03 • Kịch bản phân cảnh"
              tag={<span className="rounded-md bg-jade-500 px-2 py-0.5 text-[11px] leading-4 font-bold text-white uppercase">Format Hollywood</span>}
              footer={
                <>
                  <span className="text-xs leading-4 text-slate-500">Xuất định dạng:</span>
                  <ul className="flex gap-1.5">
                    {d.exportFormats.map((f) => (
                      <li key={f} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] leading-4 font-semibold text-slate-600">
                        {f}
                      </li>
                    ))}
                  </ul>
                </>
              }
            >
              <div lang="vi" className="rounded-xl bg-slate-900 p-4 text-xs leading-5 text-slate-300">
                <p className="font-semibold text-jade-500">{d.script.slugline}</p>
                {d.script.blocks.map((b) => (
                  <p key={b.text} className={cn('mt-2.5', b.kind === 'shot' ? 'text-[11px] text-slate-500' : 'text-slate-200')}>
                    {b.text}
                  </p>
                ))}
                <div className="mt-3 text-center">
                  <p className="font-bold tracking-[0.08em] text-jade-500">{d.script.character}</p>
                  <p className="text-[11px] leading-4 text-slate-500 italic">{d.script.parenthetical}</p>
                  <p className="mt-1 font-medium text-white">{d.script.dialogue}</p>
                </div>
              </div>
            </StageCard>
          </div>
        </div>
      </Container>
    </section>
  )
}
