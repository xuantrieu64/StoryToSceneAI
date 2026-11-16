import { sectionIds } from '@/config/site-links'
import { genres } from '../data/home-content'
import { ImageOverlayCard } from './shared/ImageOverlayCard'
import { Section } from './shared/Section'
import { SectionHeader } from './shared/SectionHeader'

export function GenresSection() {
  return (
    <Section id={sectionIds.genres} tone="surface" aria-labelledby="genres-title">
      <SectionHeader
        id="genres-title"
        eyebrow="Thể loại & Phong cách"
        title="Không gian cho mọi cốt truyện"
        description="Chọn phong cách thị giác và âm hưởng kể chuyện đặc thù. Studio tự động tinh chỉnh góc máy, ánh sáng và thoại phù hợp từng thể loại."
      />
      <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:mt-16 lg:grid-cols-4">
        {genres.map((genre) => (
          <li key={genre.title}>
            <ImageOverlayCard
              variant="genre"
              title={genre.title}
              description={genre.description}
              src={genre.src}
              className="aspect-[276/345] w-full"
            />
          </li>
        ))}
      </ul>
    </Section>
  )
}
