import { Star } from 'lucide-react'
import { sectionIds } from '@/config/site-links'
import { testimonials } from '../data/home-content'
import { Container } from './shared/Container'
import { SectionHeading } from './shared/SectionHeading'

/** Avatar chữ cái đầu (chưa có ảnh chân dung thật từ Figma). */
function InitialsAvatar({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/)
  const initials = (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return (
    <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white ring-2 ring-white">
      {initials}
    </span>
  )
}

export function TestimonialsSection() {
  return (
    <section id={sectionIds.testimonials} aria-labelledby="testimonials-title" className="bg-white py-16 lg:py-24">
      <Container>
        <SectionHeading
          id="testimonials-title"
          eyebrow="Đánh giá từ cộng đồng sáng tạo"
          title="Được tin dùng bởi hơn 4.200+ tác giả & nhà làm phim độc lập"
          description="Lắng nghe chia sẻ từ những người đã biến trang sách thành những thước phim điện ảnh đầu tay cùng StoryToScene."
          className="max-w-3xl"
        />
        <ul className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3 lg:mt-14 lg:gap-8">
          {testimonials.map((t) => (
            <li key={t.name}>
              <figure className="flex h-full flex-col rounded-2xl border border-slate-200/70 bg-slate-50 p-6 lg:p-8">
                <div className="flex items-center gap-2">
                  <span className="flex gap-0.5 text-amber-400" role="img" aria-label="Đánh giá 5 trên 5 sao">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} aria-hidden="true" className="size-3.5 fill-current" />
                    ))}
                  </span>
                  <span className="text-xs leading-4 font-medium text-slate-400 tabular-nums">5.0 / 5.0</span>
                </div>
                <blockquote className="mt-4 flex-1 text-sm leading-6 text-slate-600 italic">{t.quote}</blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-slate-200/80 pt-5">
                  <InitialsAvatar name={t.name} />
                  <span className="flex flex-col">
                    <span className="text-sm leading-5 font-semibold text-slate-900">{t.name}</span>
                    <span className="text-xs leading-4 text-slate-500">
                      {t.role}
                      {t.work && <em className="not-italic"> {t.work}</em>}
                    </span>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
