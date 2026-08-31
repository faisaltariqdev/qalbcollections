"use client";

import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Sticky header shell.
 *
 * Cream atelier bar — mark, links and icons sit on the house stone.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-8 z-40 border-b bg-nav/95 backdrop-blur-md transition-all duration-500 ease-[var(--ease-luxe)]",
        scrolled
          ? "border-ink/15 shadow-[0_1px_0_rgba(197,160,89,0.18),0_18px_40px_-32px_rgba(20,8,8,0.6)]"
          : "border-ink/10",
      )}
    >
      {children}
    </header>
  );
}
