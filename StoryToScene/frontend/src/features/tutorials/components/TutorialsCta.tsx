import { ArrowRight } from 'lucide-react'
import { siteLinks } from '@/config/site-links'
import { ActionLink } from '@/features/home/components/shared/ActionLink'
import { homeButton } from '@/features/home/components/shared/button-styles'
import { Container } from '@/features/home/components/shared/Container'

/** Khối kêu gọi dùng thử cuối trang Hướng dẫn. */
export function TutorialsCta() {
  return (
    <section aria-labelledby="tutorials-cta-title" className="pb-16 lg:pb-24">
      <Container>
        <div className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-linear-to-br from-white to-jade-50/60 p-6 sm:p-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="tutorials-cta-title" className="text-2xl leading-8 font-bold tracking-[-0.02em] text-slate-900 sm:text-[28px] sm:leading-9">
              Trải nghiệm ngay với câu chuyện của bạn
            </h2>
            <p className="mt-2 text-[15px] leading-6 text-slate-500">
              Tài khoản mới có thể bắt đầu ngay lập tức, không yêu cầu thẻ tín dụng.
            </p>
          </div>
          <ActionLink href={siteLinks.register} className={homeButton({ size: 'lg', className: 'w-full md:w-auto' })}>
            Dùng thử miễn phí
            <ArrowRight aria-hidden="true" />
          </ActionLink>
        </div>
      </Container>
    </section>
  )
}
