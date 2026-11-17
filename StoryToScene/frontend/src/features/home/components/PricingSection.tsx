import { Check, X } from 'lucide-react'
import { sectionIds } from '@/config/site-links'
import { cn } from '@/lib/utils'
import { pricingPlans, type PricingPlan } from '../data/home-content'
import { ActionLink } from './shared/ActionLink'
import { homeButton } from './shared/button-styles'
import { Container } from './shared/Container'
import { SectionHeading } from './shared/SectionHeading'

function PricingCard({ plan }: { plan: PricingPlan }) {
  const { highlighted } = plan

  return (
    <article
      aria-labelledby={`plan-${plan.id}`}
      className={cn(
        'relative flex flex-col rounded-2xl bg-white p-6 sm:p-8',
        highlighted
          ? 'border-2 border-jade-500 shadow-[0_24px_50px_-20px_rgb(0_176_116/0.45)] lg:-my-4 lg:py-10'
          : 'border border-slate-200/80 shadow-xs',
      )}
    >
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-jade-500 px-3 py-1 text-[11px] leading-4 font-semibold tracking-[0.04em] whitespace-nowrap text-white uppercase">
          Phổ biến nhất • Tiết kiệm 40%
        </span>
      )}

      <p className={cn('text-[11px] leading-4 font-semibold tracking-[0.06em] uppercase', highlighted ? 'text-jade-600' : 'text-slate-500')}>
        {plan.audience}
      </p>
      <h3 id={`plan-${plan.id}`} className="mt-2 text-2xl leading-8 font-semibold text-slate-900">
        {plan.name}
      </h3>
      <p className="mt-4 flex items-baseline gap-1.5">
        <span className="text-[40px] leading-[48px] font-bold tracking-[-0.03em] text-slate-900 tabular-nums">{plan.price}</span>
        <span className="text-[11px] leading-4 font-semibold text-slate-500">{plan.unit}</span>
      </p>
      <p className="mt-3 border-b border-slate-100 pb-6 text-xs leading-5 text-slate-500">{plan.description}</p>

      <ul className="mt-6 flex flex-1 flex-col gap-3.5">
        {plan.features.map((f) => {
          const included = f.included !== false
          const Icon = included ? Check : X
          return (
            <li key={f.text + (f.strong ?? '')} className="flex items-start gap-2.5 text-[13px] leading-5">
              <Icon aria-hidden="true" className={cn('mt-0.5 size-4 shrink-0', included ? 'text-jade-500' : 'text-slate-300')} strokeWidth={2.25} />
              <span className={included ? 'text-slate-600' : 'text-slate-400'}>
                {!included && <span className="sr-only">Không bao gồm: </span>}
                {f.strong && f.text.startsWith(' ') && <strong className="font-semibold text-slate-900">{f.strong}</strong>}
                {f.text}
                {f.strong && !f.text.startsWith(' ') && <strong className="font-semibold text-slate-900">{f.strong}</strong>}
              </span>
            </li>
          )
        })}
      </ul>

      <ActionLink
        href={plan.cta.href}
        unavailableLabel="Thanh toán trực tuyến sắp ra mắt"
        className={cn('mt-8', homeButton({ variant: highlighted ? 'primary' : 'outline', size: 'block' }))}
      >
        {plan.cta.label}
      </ActionLink>
    </article>
  )
}

export function PricingSection() {
  return (
    <section id={sectionIds.pricing} aria-labelledby="pricing-title" className="border-y border-slate-100 bg-slate-50 py-16 lg:py-24">
      <Container>
        <SectionHeading
          id="pricing-title"
          eyebrow="Chi phí linh hoạt • Không phí ẩn"
          title="Chọn gói phù hợp với bạn"
          description="Dành cho tác giả tiểu thuyết độc lập, nhà sáng tạo nội dung YouTube/TikTok và các đội ngũ sản xuất phim ngắn chuyên nghiệp."
        />

        <div className="mx-auto mt-12 grid max-w-md grid-cols-1 gap-8 lg:mt-16 lg:max-w-none lg:grid-cols-3 lg:items-center lg:gap-6">
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} />
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3.5 lg:mt-14 lg:flex-row lg:items-center lg:justify-between">
          <p className="flex items-center gap-3 text-xs leading-5 text-slate-500">
            <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-md bg-jade-50 text-[10px] font-bold text-jade-600">
              QR
            </span>
            Thanh toán quét mã VietQR tự động kích hoạt tài khoản trong 30 giây. Hỗ trợ doanh nghiệp xuất hóa đơn VAT điện tử.
          </p>
          <p className="flex shrink-0 items-center gap-3 pl-10 text-xs leading-5 font-medium text-slate-700 lg:pl-0">
            Cam kết hoàn tiền trong 7 ngày
            <span aria-hidden="true" className="size-1 rounded-full bg-slate-400" />
            Bảo mật dữ liệu 100%
          </p>
        </div>
      </Container>
    </section>
  )
}
