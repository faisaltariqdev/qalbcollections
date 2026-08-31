"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** Disclosure used for product detail panels, FAQs and mobile filters. */

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({
  className,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={cn("border-b border-line last:border-b-0", className)}
      {...props}
    />
  );
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
          className={cn(
          "group flex flex-1 items-center justify-between gap-4 py-5 text-left font-sans text-sm font-medium text-ink transition-colors hover:text-champ",
          className,
        )}
        {...props}
      >
        {children}
        <Plus
          aria-hidden
          className="size-4 shrink-0 text-muted transition-transform duration-300 ease-[var(--ease-luxe)] group-data-[state=open]:rotate-45"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className="overflow-hidden data-[state=closed]:animate-[collapse-up_0.28s_var(--ease-luxe)] data-[state=open]:animate-[collapse-down_0.28s_var(--ease-luxe)]"
      {...props}
    >
      <div className={cn("pb-6 text-sm leading-relaxed text-muted", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}
