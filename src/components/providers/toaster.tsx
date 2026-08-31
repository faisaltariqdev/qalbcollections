"use client";

import { Toaster as SonnerToaster } from "sonner";

/** Toast surface styled to the design system rather than Sonner's defaults. */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      duration={3800}
      gap={10}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-start gap-3 border border-line bg-canvas px-4 py-3.5 text-sm text-ink shadow-lift",
          title: "font-sans text-sm font-medium leading-snug",
          description: "mt-1 text-xs leading-relaxed text-muted",
          actionButton:
            "ml-auto shrink-0 text-[0.625rem] font-medium uppercase tracking-[0.16em] text-qalb",
          closeButton: "text-muted",
          error: "border-danger/40",
          success: "border-success/40",
        },
      }}
    />
  );
}
