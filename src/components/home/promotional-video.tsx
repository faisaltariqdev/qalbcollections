"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Cinematic full-width promotional video block above the footer.
 *
 * Muted, looping, autoplay video with a dark scrim and a slow-reveal headline.
 * A subtle play-state indicator line at the bottom hints at the motion.
 */
export function PromotionalVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting);
        setInView(visible);
        if (visible) {
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="video-story" className="relative isolate overflow-hidden bg-void">
      {/* Video fills the block, cropped to a cinematic 21:9-ish ratio */}
      <div className="relative aspect-[16/7] min-h-[22rem] sm:aspect-[21/9] sm:min-h-[28rem] lg:min-h-[36rem]">
        <video
          ref={videoRef}
          src="/media/video/promotional-watch.mp4"
          muted
          loop
          playsInline
          autoPlay
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Dark cinematic scrim so the text pops */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-void/80 via-void/40 to-void/60"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-void/90 to-transparent"
        />

        {/* Centered editorial copy */}
        <div className="shell-x absolute inset-0 flex flex-col items-center justify-center text-center">
          <p
            className={cn(
              "eyebrow text-champ tracking-[0.34em] transition-all duration-1000 ease-[var(--ease-luxe)]",
              inView ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
            )}
          >
            THE ART OF TIME
          </p>
          <h2
            className={cn(
              "mt-5 max-w-4xl font-display text-[clamp(2.5rem,7vw,5.5rem)] font-normal uppercase leading-[0.9] tracking-[-0.02em] text-warm-white transition-all duration-1000 delay-150 ease-[var(--ease-luxe)]",
              inView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
            )}
          >
            Watch the craft<br />come alive.
          </h2>
          <p
            className={cn(
              "mt-5 max-w-lg text-[0.9375rem] leading-relaxed text-warm-white/65 transition-all duration-1000 delay-300 ease-[var(--ease-luxe)]",
              inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
            )}
          >
            Every movement, every reflection, every detail — captured in motion.
          </p>
        </div>
      </div>

      {/* Thin champagne progress shimmer */}
      <div className="absolute bottom-0 left-0 h-px w-full overflow-hidden bg-warm-white/10">
        <span className="block h-full w-1/3 animate-[shimmer_3s_linear_infinite] bg-gradient-to-r from-transparent via-champ to-transparent" />
      </div>
    </section>
  );
}
