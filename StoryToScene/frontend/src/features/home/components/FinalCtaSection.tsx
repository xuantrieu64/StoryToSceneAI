import { BadgeCheck, Clapperboard, Lock } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { anchor, sectionIds } from '@/config/site-links'
import { cn } from '@/lib/utils'
import { tryFreeLink } from '../data/home-content'
import { ActionLink } from './shared/ActionLink'
import { CheckItem } from './shared/CheckItem'
import { IconTile } from './shared/IconTile'

export function FinalCtaSection() {
  return (
    <section aria-labelledby="cta-title" className="bg-page px-4 py-16 sm:px-6 lg:px-16 lg:py-24">
      <div className="mx-auto flex max-w-[1152px] flex-col items-center rounded-2xl bg-white px-5 py-14 text-center shadow-xl sm:px-10 lg:py-24">
        <IconTile icon={Clapperboard} size="lg" className="mb-4" />
        <h2
          id="cta-title"
          className="mb-3 max-w-[760px] text-balance text-[34px] leading-[42px] font-semibold tracking-[-0.02em] text-ink sm:text-5xl sm:leading-[56px] lg:text-[56px] lg:leading-16"
        >
          Sẵn sàng đưa con chữ của bạn lên màn ảnh lớn?
        </h2>
        <p className="mb-10 max-w-[576px] text-base leading-7 text-ink-muted sm:text-lg">
          Tham gia cùng hơn 2.500 nhà văn, biên kịch và nhà sản xuất phim ngắn đang sáng tác mỗi ngày với
          StoryToScene.
        </p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <ActionLink {...tryFreeLink} className={cn(buttonVariants({ variant: 'brand', size: 'cta-lg' }), 'sm:px-16')}>
            Bắt đầu chuyển thể miễn phí
          </ActionLink>
          <a href={anchor(sectionIds.demo)} className={buttonVariants({ variant: 'muted', size: 'cta-lg' })}>
            Khám phá kho kịch bản
          </a>
        </div>
        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <li>
            <CheckItem icon={BadgeCheck}>Bản quyền 100% thuộc tác giả</CheckItem>
          </li>
          <li>
            <CheckItem icon={Lock}>Bảo mật dữ liệu tuyệt đối</CheckItem>
          </li>
        </ul>
      </div>
    </section>
  )
}
