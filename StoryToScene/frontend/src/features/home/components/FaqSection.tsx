import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { sectionIds } from '@/config/site-links'
import { faqs } from '../data/home-content'
import { Section } from './shared/Section'
import { SectionHeader } from './shared/SectionHeader'

export function FaqSection() {
  return (
    <Section
      id={sectionIds.faq}
      tone="surface"
      aria-labelledby="faq-title"
      innerClassName="max-w-[800px]"
    >
      <SectionHeader
        id="faq-title"
        eyebrow="Giải đáp thắc mắc"
        title="Câu hỏi thường gặp"
        description="Mọi điều bạn cần biết trước khi bắt đầu chuyển thể kịch bản đầu tiên của mình."
      />
      <Accordion className="mt-10 gap-3 lg:mt-16">
        {faqs.map((faq) => (
          <AccordionItem key={faq.question} className="rounded-xl bg-white shadow-xs">
            <AccordionTrigger className="rounded-xl px-5 py-5 text-[17px] leading-7 font-semibold text-ink sm:px-6 sm:py-6 sm:text-lg">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="px-5 pb-6 text-[15px] leading-6 text-ink-muted sm:px-6">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  )
}
