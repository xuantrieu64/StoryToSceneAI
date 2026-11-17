import { ArrowRight, Check, ExternalLink } from 'lucide-react'
import { anchor, sectionIds, siteLinks } from '@/config/site-links'
import { heroTrust } from '../data/home-content'
import { StudioTerminal } from './StudioTerminal'
import { ActionLink } from './shared/ActionLink'
import { homeButton } from './shared/button-styles'
import { Container } from './shared/Container'

export function HeroSection() {
  return (
    <section
      id={sectionIds.top}
      aria-labelledby="hero-title"
      className="relative overflow-hidden border-b border-slate-100 bg-[radial-gradient(ellipse_at_10%_10%,#e2f4ee_0%,transparent_55%),radial-gradient(ellipse_at_20%_100%,#e9f7f2_0%,transparent_50%)] bg-slate-50/40"
    >
      <Container className="grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-2 lg:gap-10 lg:py-[88px]">
        <div className="flex flex-col items-start">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-jade-200 bg-jade-50 px-3.5 py-1.5 text-[11px] leading-4 font-semibold tracking-[0.04em] text-jade-700 uppercase">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-jade-500" />
            12 thể loại • 18 phong cách hình ảnh Auteur
          </p>

          <h1
            id="hero-title"
            className="text-[40px] leading-[1.12] font-bold tracking-[-0.03em] text-slate-900 sm:text-5xl lg:text-[52px]"
          >
            Biến truyện thành <span className="block text-jade-500">kịch bản phim ngắn</span>
          </h1>

          <p className="mt-6 max-w-[540px] text-base leading-7 text-slate-600 sm:text-[17px]">
            Dán một chương truyện, AI tự động phân tích bối cảnh, bóc tách chuỗi sự kiện then chốt và tạo ra kịch bản
            phân cảnh chuẩn Hollywood cho đạo diễn, biên kịch và đoàn làm phim độc lập.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ActionLink href={siteLinks.register} className={homeButton({ size: 'lg', className: 'sm:px-8' })}>
              Đăng ký dùng thử miễn phí
              <ArrowRight aria-hidden="true" />
            </ActionLink>
            <a href={anchor(sectionIds.pipeline)} className={homeButton({ variant: 'outline', size: 'lg' })}>
              Xem kịch bản mẫu
              <ExternalLink aria-hidden="true" className="text-slate-400" />
            </a>
          </div>

          <ul className="mt-8 grid w-full max-w-[540px] grid-cols-1 gap-3 border-t border-slate-200/70 pt-6 sm:grid-cols-3">
            {heroTrust.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs leading-4 text-slate-500">
                <Check aria-hidden="true" className="mt-px size-3.5 shrink-0 text-jade-500" strokeWidth={2.5} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <StudioTerminal />
      </Container>
    </section>
  )
}
