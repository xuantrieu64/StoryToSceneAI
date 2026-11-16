import { ArrowUpRight, Check, Info, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { sectionIds, siteLinks } from '@/config/site-links'
import { cn } from '@/lib/utils'
import { pricingPlans, type PlanFeature, type PricingPlan } from '../data/home-content'
import { ActionLink } from './shared/ActionLink'
import { Section } from './shared/Section'
import { SectionHeader } from './shared/SectionHeader'

function FeatureItem({ feature, emphasize }: { feature: PlanFeature; emphasize: boolean }) {
  const Icon = feature.included ? Check : X
  return (
    <li className="flex items-start gap-2.5">
      <Icon
        aria-hidden="true"
        className={cn('mt-1 size-3.5 shrink-0', feature.included ? 'text-brand-deep' : 'text-ink-muted/60')}
        strokeWidth={2.5}
      />
      <span
        className={cn(
          'text-[13px] leading-5',
          !feature.included && 'text-ink-muted/60 line-through',
          feature.included && (emphasize ? 'text-ink' : 'text-ink-muted'),
        )}
      >
        {!feature.included && <span className="sr-only">Không bao gồm: </span>}
        {feature.segments.map((seg, i) =>
          seg.strong ? (
            <strong key={i} className="font-semibold">
              {seg.text}
            </strong>
          ) : (
            <span key={i}>{seg.text}</span>
          ),
        )}
      </span>
    </li>
  )
}

function PricingCard({ plan }: { plan: PricingPlan }) {
  const { highlighted } = plan
  const isFree = plan.id === 'free'

  return (
    <article
      aria-labelledby={`plan-${plan.id}`}
      className={cn(
        'relative flex flex-col rounded-2xl bg-white p-6 sm:p-8 lg:p-10',
        highlighted ? 'shadow-xl ring-1 ring-brand/15 lg:-mt-2' : 'shadow-xs',
      )}
    >
      {highlighted && (
        <Badge
          variant="solid"
          shape="pill"
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 font-semibold tracking-[0.05em] uppercase shadow-xs"
        >
          Phổ biến nhất
        </Badge>
      )}

      <div className={cn('flex flex-col gap-3 pb-10', highlighted && 'pt-2')}>
        {/* 1024–1279px card hẹp: tag xuống dưới tên gói để tên luôn 1 dòng và giá thẳng hàng */}
        <div className="flex items-center justify-between gap-2 lg:flex-col lg:items-start xl:flex-row xl:items-center">
          <h3 id={`plan-${plan.id}`} className="text-xl leading-7 font-semibold text-ink">
            {plan.name}
          </h3>
          <Badge variant={highlighted ? 'accent' : 'neutral'} className="px-2">
            {plan.tag}
          </Badge>
        </div>
        <div>
          <p
            className={cn(
              'text-[36px] leading-[44px] font-bold tracking-[-0.015em] sm:text-[40px] sm:leading-[48px]',
              highlighted ? 'text-brand-deep' : 'text-ink',
            )}
          >
            {plan.price}
          </p>
          <p className="text-[13px] leading-5 text-ink-muted">{plan.period}</p>
        </div>
        <ul className="flex flex-col gap-3 pt-7">
          {plan.features.map((feature, i) => (
            <FeatureItem key={i} feature={feature} emphasize={!isFree} />
          ))}
        </ul>
      </div>

      <ActionLink
        href={plan.cta.href}
        unavailableLabel={isFree ? 'Đăng ký sắp ra mắt' : 'Thanh toán sắp ra mắt'}
        className={cn(buttonVariants({ variant: highlighted ? 'brand' : 'muted', size: 'block' }), 'mt-auto')}
      >
        {plan.cta.label}
      </ActionLink>
    </article>
  )
}

export function PricingSection() {
  return (
    <Section id={sectionIds.pricing} aria-labelledby="pricing-title">
      <SectionHeader
        id="pricing-title"
        eyebrow="Bảng giá minh bạch"
        title="Chọn gói phù hợp với bạn"
        description="Không cần thẻ tín dụng. Nâng cấp đơn giản qua quét mã QR chuyển khoản ngân hàng (VND). Tài khoản mở ngay lập tức khi tiền vào."
      />

      <div className="mt-12 grid grid-cols-1 gap-8 md:mx-auto md:max-w-[480px] lg:mt-10 lg:max-w-none lg:grid-cols-3 lg:gap-6 lg:pt-6">
        {pricingPlans.map((plan) => (
          <PricingCard key={plan.id} plan={plan} />
        ))}
      </div>

      <div className="mt-10 flex flex-col items-start justify-between gap-3 rounded-xl bg-surface p-4 sm:flex-row sm:items-center">
        <p className="flex items-start gap-2 text-[13px] leading-5 text-ink-muted sm:items-center">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-brand-deep sm:mt-0" />
          Cần thêm dung lượng lớn hơn hoặc tư vấn tổ chức? Liên hệ trực tiếp qua Zalo hỗ trợ.
        </p>
        <ActionLink
          href={siteLinks.zaloSupport}
          unavailableLabel="Kênh Zalo hỗ trợ sắp được cập nhật"
          className="inline-flex shrink-0 items-center gap-1 text-xs leading-4 font-semibold tracking-[0.04em] text-brand-deep hover:underline"
        >
          Hỗ trợ Zalo 24/7
          <ArrowUpRight aria-hidden="true" className="size-3" strokeWidth={2.5} />
        </ActionLink>
      </div>
    </Section>
  )
}
