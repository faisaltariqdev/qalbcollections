"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * Shared FAQ disclosure list, used on product pages and content pages.
 *
 * Wherever FAQPage structured data is emitted, this renders the same questions
 * and answers visibly — the markup always matches what a visitor can read.
 */
export function FaqAccordion({
  faqs,
  className,
}: {
  faqs: readonly { question: string; answer: string }[];
  className?: string;
}) {
  if (faqs.length === 0) return null;

  return (
    <Accordion type="single" collapsible className={className ?? "border-t border-line"}>
      {faqs.map((faq, index) => (
        <AccordionItem key={faq.question} value={`faq-${index}`}>
          <AccordionTrigger>{faq.question}</AccordionTrigger>
          <AccordionContent>{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
