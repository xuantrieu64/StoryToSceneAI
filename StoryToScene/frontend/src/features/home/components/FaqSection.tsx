import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion'
import { Triangle } from 'lucide-react'
import { sectionIds } from '@/config/site-links'
import { faqs } from '../data/home-content'
import { Container } from './shared/Container'
import { SectionHeading } from './shared/SectionHeading'

export function FaqSection() {
  return (
    <section id={sectionIds.faq} aria-labelledby="faq-title" className="border-t border-slate-100 bg-white py-16 lg:py-24">
      <Container className="max-w-4xl">
        <SectionHeading id="faq-title" eyebrow="Giải đáp thắc mắc" title="Câu hỏi thường gặp" />
        {/* Mặc định mở câu hỏi đầu tiên như trong thiết kế */}
        <AccordionPrimitive.Root defaultValue={[0]} className="mt-10 flex flex-col gap-3 lg:mt-12">
          {faqs.map((faq, i) => (
            <AccordionPrimitive.Item key={faq.question} value={i} className="rounded-xl border border-slate-200/80 bg-slate-50">
              <AccordionPrimitive.Header>
                <AccordionPrimitive.Trigger className="group flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl px-5 py-4 text-left text-sm leading-6 font-semibold text-slate-900 outline-none focus-visible:ring-3 focus-visible:ring-jade-500/40 sm:px-6">
                  {faq.question}
                  <Triangle
                    aria-hidden="true"
                    className="size-2.5 shrink-0 rotate-180 fill-jade-500 text-jade-500 transition-transform group-data-[panel-open]:rotate-0"
                  />
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
              <AccordionPrimitive.Panel className="h-(--accordion-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0 motion-reduce:transition-none">
                <p className="px-5 pb-5 text-[13px] leading-6 text-slate-500 sm:px-6">{faq.answer}</p>
              </AccordionPrimitive.Panel>
            </AccordionPrimitive.Item>
          ))}
        </AccordionPrimitive.Root>
      </Container>
    </section>
  )
}
