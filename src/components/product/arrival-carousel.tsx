"use client";

import { ChevronRight } from "lucide-react";
import { useEffect, useRef } from "react";

import { ArrivalCard } from "@/components/product/arrival-card";
import type { ProductCardData } from "@/server/catalog-types";

/**
 * Horizontal scroll carousel for New Arrivals.
 *
 * Auto-scrolls gently every 4 seconds. Pauses while the user is hovering or
 * touching the track, and resumes on leave. Uses CSS scroll snap.
 */
export function ArrivalCarousel({ products }: { products: ProductCardData[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollBy = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    if (!card) return;
    track.scrollBy({ left: card.offsetWidth * direction * 1.1, behavior: "smooth" });
  };

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    timerRef.current = setInterval(() => {
      if (pausedRef.current) return;
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (track.scrollLeft >= maxScroll - 4) {
        track.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollBy(1);
      }
    }, 4000);

    const pause = () => { pausedRef.current = true; };
    const resume = () => { pausedRef.current = false; };

    track.addEventListener("pointerenter", pause);
    track.addEventListener("pointerleave", resume);
    track.addEventListener("touchstart", pause, { passive: true });
    track.addEventListener("touchend", resume, { passive: true });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      track.removeEventListener("pointerenter", pause);
      track.removeEventListener("pointerleave", resume);
      track.removeEventListener("touchstart", pause);
      track.removeEventListener("touchend", resume);
    };
  }, []);

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="scrollbar-slim -mr-6 flex snap-x snap-mandatory gap-6 overflow-x-auto pr-6 pb-4 sm:-mr-10 sm:gap-8 sm:pr-10"
      >
        {products.map((product) => (
          <div key={product.id} className="snap-start">
            <ArrivalCard product={product} />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scrollBy(1)}
        aria-label="Scroll to next arrivals"
        className="absolute -right-1 top-1/3 hidden size-12 -translate-y-1/2 items-center justify-center rounded-full bg-void text-warm-white transition-colors duration-300 hover:bg-champ hover:text-void xl:flex"
      >
        <ChevronRight className="size-5" strokeWidth={1.5} />
      </button>
    </div>
  );
}
