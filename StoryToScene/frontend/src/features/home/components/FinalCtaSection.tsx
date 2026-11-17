import { ArrowRight, Film, ShieldCheck, Zap } from 'lucide-react'
import { anchor, sectionIds, siteLinks } from '@/config/site-links'
import { ActionLink } from './shared/ActionLink'
import { homeButton } from './shared/button-styles'
import { Container } from './shared/Container'

export function FinalCtaSection() {
  return (
    <section aria-labelledby="cta-title" className="bg-linear-to-b from-white to-jade-50/80 py-20 lg:py-28">
      <Container className="flex max-w-3xl flex-col items-center text-center">
        <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-xl bg-jade-100 text-jade-600">
          <Film className="size-6" />
        </span>
        <h2 id="cta-title" className="mt-6 text-[30px] leading-[1.2] font-bold tracking-[-0.02em] text-slate-900 sm:text-[38px]">
          Sẵn sàng đưa con chữ của bạn <span className="block text-jade-500">lên màn ảnh lớn?</span>
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500 sm:text-[15px]">
          Tham gia cùng hơn 4.200 tác giả, đạo diễn và nhà làm phim đang biến hàng nghìn trang truyện thành kịch bản phân
          cảnh mỗi tuần.
        </p>
        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <ActionLink href={siteLinks.register} className={homeButton({ size: 'lg', className: 'sm:px-9' })}>
            Bắt đầu chuyển thể miễn phí <ArrowRight aria-hidden="true" />
          </ActionLink>
          <a href={anchor(sectionIds.genres)} className={homeButton({ variant: 'outline', size: 'lg' })}>
            Xem 8 preset thể loại
          </a>
        </div>
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs leading-4 text-slate-500">
          <li className="flex items-center gap-1.5">
            <ShieldCheck aria-hidden="true" className="size-3.5 text-jade-500" /> Bảo đảm 100% thuộc tác giả
          </li>
          <li aria-hidden="true" className="size-1 rounded-full bg-slate-300" />
          <li className="flex items-center gap-1.5">
            <Zap aria-hidden="true" className="size-3.5 text-jade-500" /> Tốc độ xử lý dưới 60 giây
          </li>
        </ul>
      </Container>
    </section>
  )
}
