"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface Panel {
  id: string;
  title: string;
  body: string;
}

/**
 * Delivery, returns and authenticity panels.
 *
 * Collapsed by default so the buying decision is not buried under policy text,
 * but present on the page rather than a link away — the questions that stop a
 * purchase should be answerable without leaving.
 */
export function ProductPanels({ panels }: { panels: Panel[] }) {
  if (panels.length === 0) return null;

  return (
    <Accordion type="single" collapsible className="border-t border-line">
      {panels.map((panel) => (
        <AccordionItem key={panel.id} value={panel.id}>
          <AccordionTrigger>{panel.title}</AccordionTrigger>
          <AccordionContent>
            {panel.body.split("\n").map((line, index) => (
              <p key={index} className={index > 0 ? "mt-3" : undefined}>
                {line}
              </p>
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}