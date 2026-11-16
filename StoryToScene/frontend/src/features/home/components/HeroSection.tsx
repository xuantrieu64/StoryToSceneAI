import { ArrowDown, CircleCheck } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { anchor, sectionIds } from '@/config/site-links'
import { cn } from '@/lib/utils'
import { tryFreeLink } from '../data/home-content'
import { PosterMosaic } from './PosterMosaic'
import { ActionLink } from './shared/ActionLink'
import { CheckItem } from './shared/CheckItem'

export function HeroSection() {
  return (
    <section
      id={sectionIds.hero}
      aria-labelledby="hero-title"
      className="bg-page px-4 pt-10 pb-16 sm:px-6 lg:px-16 lg:pt-[120px] lg:pb-24"
    >
      <div className="mx-auto grid max-w-[1152px] grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
        {/* Cột trái: copy & CTA */}
        <div className="flex flex-col items-start lg:col-span-6">
          <Badge variant="accent" shape="pill" className="mb-4 shadow-xs">
            <span aria-hidden="true" className="size-2 rounded-full bg-brand-deep" />
            12 thể loại • 14 phong cách hình ảnh
          </Badge>

          <h1
            id="hero-title"
            className="mb-4 text-[40px] leading-[48px] font-semibold tracking-[-0.02em] text-ink sm:text-5xl sm:leading-[56px] lg:text-[56px] lg:leading-16"
          >
            Biến truyện thành{' '}
            <em className="font-semibold text-brand-deep italic">kịch bản phim ngắn</em>
          </h1>

          <p className="mb-10 max-w-[576px] text-base leading-7 text-ink-muted sm:text-lg">
            Dán một chương truyện. AI tự động phân rã chương, bóc tách chuỗi sự kiện then chốt và tạo kịch
            bản phân cảnh chuẩn điện ảnh cho đạo diễn và đoàn phim.
          </p>

          <div className="mb-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            <ActionLink {...tryFreeLink} className={cn(buttonVariants({ variant: 'brand', size: 'cta' }), 'sm:px-10')}>
              Dùng thử miễn phí
            </ActionLink>
            <a href={anchor(sectionIds.demo)} className={buttonVariants({ variant: 'surface', size: 'cta' })}>
              Xem kịch bản mẫu
              <ArrowDown aria-hidden="true" className="size-3" strokeWidth={2.5} />
            </a>
          </div>

          <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <li>
              <CheckItem icon={CircleCheck}>Đăng ký bằng Google hoặc email</CheckItem>
            </li>
            <li>
              <CheckItem icon={CircleCheck}>Không cần thẻ tín dụng</CheckItem>
            </li>
          </ul>
        </div>

        {/* Cột phải: mosaic poster */}
        <div className="mx-auto w-full max-w-[560px] lg:col-span-6 lg:max-w-none">
          <PosterMosaic />
        </div>
      </div>
    </section>
  )
}
