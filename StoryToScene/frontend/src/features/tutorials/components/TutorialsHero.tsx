import type { ReactNode } from 'react'
import { Clock } from 'lucide-react'
import { Container } from '@/features/home/components/shared/Container'

type TutorialsHeroProps = {
  lessonCount: number
  totalMinutes: number
  /** Bộ lọc ngôn ngữ */
  languageFilter: ReactNode
  /** Khung trailer */
  trailer: ReactNode
}

export function TutorialsHero({ lessonCount, totalMinutes, languageFilter, trailer }: TutorialsHeroProps) {
  return (
    <section aria-labelledby="tutorials-title" className="bg-[radial-gradient(ellipse_at_0%_0%,#e6f6ef_0%,transparent_50%)] pt-12 pb-14 sm:pt-16 lg:pt-14 lg:pb-16">
      <Container className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
        <div>
          <p className="text-xs leading-4 font-semibold tracking-[0.12em] text-jade-600 uppercase">Hướng dẫn</p>
          <h1 id="tutorials-title" className="mt-3 text-[36px] leading-[1.12] font-bold tracking-[-0.03em] text-slate-900 sm:text-[44px] lg:text-[48px]">
            Học StoryToScene <span className="sm:block">qua {lessonCount} video ngắn</span>
          </h1>
          <p className="mt-5 max-w-[520px] text-base leading-7 text-slate-600 sm:text-[17px]">
            Mỗi video chỉ khoảng 30 giây, có thuyết minh và phụ đề. Bạn có thể xem tuần tự hoặc chọn ngay bước cần tìm hiểu.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {languageFilter}
            <p className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm leading-5 text-slate-600">
              <Clock aria-hidden="true" className="size-4 text-slate-400" />
              {lessonCount} bài học · khoảng {totalMinutes} phút
            </p>
          </div>
        </div>
        {trailer}
      </Container>
    </section>
  )
}
