import { BlogSection } from '../features/home/components/BlogSection'
import { FaqSection } from '../features/home/components/FaqSection'
import { FinalCtaSection } from '../features/home/components/FinalCtaSection'
import { GenresSection } from '../features/home/components/GenresSection'
import { HeroSection } from '../features/home/components/HeroSection'
import { PipelineSection } from '../features/home/components/PipelineSection'
import { PricingSection } from '../features/home/components/PricingSection'
import { SiteFooter } from '../features/home/components/SiteFooter'
import { SiteHeader } from '../features/home/components/SiteHeader'
import { StepsSection } from '../features/home/components/StepsSection'
import { TestimonialsSection } from '../features/home/components/TestimonialsSection'
import { TodayTicker } from '../features/home/components/TodayTicker'

/** Trang chủ StoryToScene – Figma node 183:903. */
function Home() {
  return (
    <div className="min-h-svh bg-white font-sans text-slate-900 antialiased">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-md"
      >
        Bỏ qua tới nội dung chính
      </a>
      <SiteHeader />
      <TodayTicker />
      <main id="main-content">
        <HeroSection />
        <GenresSection />
        <PipelineSection />
        <StepsSection />
        <PricingSection />
        <TestimonialsSection />
        <FaqSection />
        <BlogSection />
        <FinalCtaSection />
      </main>
      <SiteFooter />
    </div>
  )
}

export default Home
