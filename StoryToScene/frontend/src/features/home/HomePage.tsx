import { DemoSection } from './components/DemoSection'
import { FaqSection } from './components/FaqSection'
import { FinalCtaSection } from './components/FinalCtaSection'
import { GenresSection } from './components/GenresSection'
import { HeroSection } from './components/HeroSection'
import { HowItWorksSection } from './components/HowItWorksSection'
import { PricingSection } from './components/PricingSection'
import { SiteFooter } from './components/SiteFooter'
import { SiteHeader } from './components/SiteHeader'

/** Homepage StoryToScene – Figma node 58:2488 "Trang chủ". */
export function HomePage() {
  return (
    <div className="min-h-svh bg-page font-sans text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-md"
      >
        Bỏ qua tới nội dung chính
      </a>
      <SiteHeader />
      <main id="main-content">
        <HeroSection />
        <GenresSection />
        <DemoSection />
        <HowItWorksSection />
        <PricingSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <SiteFooter />
    </div>
  )
}
