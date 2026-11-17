import { ArrowRight } from 'lucide-react'
import { sectionIds } from '@/config/site-links'
import { genres, type Genre } from '../data/home-content'
import { Container } from './shared/Container'
import { SectionHeading } from './shared/SectionHeading'

function GenreCard({ genre }: { genre: Genre }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs transition-shadow hover:shadow-lg">
      <div className="aspect-[16/10] overflow-hidden">
        <img
          src={genre.src}
          alt={genre.title}
          width={512}
          height={279}
          loading="lazy"
          decoding="async"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] leading-4 font-semibold tracking-[0.06em] text-jade-600 uppercase">
          {genre.code} / {genre.tag}
        </p>
        <h3 className="mt-2 text-lg leading-6 font-bold text-slate-900">{genre.title}</h3>
        <p className="mt-2 flex-1 text-[13px] leading-5 text-slate-500">{genre.description}</p>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
          <span className="text-xs leading-4 text-slate-500">{genre.lens}</span>
          <ArrowRight aria-hidden="true" className="size-3.5 text-jade-500 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </article>
  )
}

export function GenresSection() {
  return (
    <section id={sectionIds.genres} aria-labelledby="genres-title" className="bg-white py-16 lg:py-24">
      <Container>
        <SectionHeading
          id="genres-title"
          layout="split"
          eyebrow="Studio presets • 08 thể loại cốt lõi"
          title="Không gian cho mọi cốt truyện điện ảnh"
          description="Chọn phong cách thị giác và định hướng kể chuyện đặc thù. Studio tự động tinh chỉnh góc máy, ánh sáng và thoại phù hợp từng thể loại."
        />
        <ul className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4 lg:gap-6">
          {genres.map((genre) => (
            <li key={genre.code}>
              <GenreCard genre={genre} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
