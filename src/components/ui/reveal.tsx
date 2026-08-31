"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Scroll-triggered fade-up. Uses one IntersectionObserver per element and
 * disconnects after the first reveal, so long editorial pages do not accumulate
 * scroll listeners. Reduced-motion users see the final state immediately (the
 * `.reveal` class handles that in CSS).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: As = "div" as ElementType,
}: {
  children: ReactNode;
  className?: string;
  /** Stagger in milliseconds for sibling items. */
  delay?: number;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // No observer (very old browsers, some test environments): show the content
    // rather than leaving it invisible. Written straight to the DOM because
    // there is nothing further to react to.
    if (typeof IntersectionObserver === "undefined") {
      node.dataset.revealed = "true";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <As
      ref={ref}
      className={cn("reveal", className)}
      data-revealed={revealed ? "true" : "false"}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </As>
  );
}
