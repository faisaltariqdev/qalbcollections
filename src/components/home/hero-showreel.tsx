"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const CLIPS = [
  { src: "/media/video/hero-watch.mp4", label: "Timepieces" },
  { src: "/media/video/hero-perfume.mp4", label: "Perfumes — coming soon" },
] as const;

/** How long each clip stays on screen before crossfading to the next. */
const HOLD_MS = 9000;

/**
 * Hero showreel — muted looping video that crossfades between a watch clip
 * and a perfume clip. A small champagne caption names the active chapter.
 * Falls back to the poster frame wherever autoplay is unavailable.
 */
export function HeroShowreel({ poster, className }: { poster: string; className?: string }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % CLIPS.length);
    }, HOLD_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    refs.current.forEach((video, index) => {
      if (!video) return;
      if (index === active) {
        // Restart from the top so every reveal begins on the clip's best frame.
        video.currentTime = 0;
        void video.play().catch(() => {});
      } else {
        // Let the outgoing clip keep playing through the 1.2s crossfade.
        setTimeout(() => {
          if (index !== active) video.pause();
        }, 1300);
      }
    });
  }, [active]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-charcoal", className)}>
      {CLIPS.map((clip, index) => (
        <video
          key={clip.src}
          ref={(node) => {
            refs.current[index] = node;
          }}
          src={clip.src}
          poster={index === 0 ? poster : undefined}
          muted
          loop
          playsInline
          autoPlay={index === 0}
          preload={index === 0 ? "auto" : "metadata"}
          aria-hidden={index !== active}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-[var(--ease-luxe)]",
            index === active ? "opacity-100" : "opacity-0",
          )}
        />
      ))}

      {/* Soft vignette so the caption stays legible on bright frames */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-void/55 to-transparent"
      />

      {/* Chapter caption */}
      <div className="pointer-events-none absolute bottom-5 left-6 sm:bottom-7 sm:left-8">
        {CLIPS.map((clip, index) => (
          <p
            key={clip.label}
            className={cn(
              "eyebrow absolute bottom-0 left-0 whitespace-nowrap text-[0.5625rem] tracking-[0.3em] text-warm-white transition-all duration-700",
              index === active ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
            )}
          >
            <span aria-hidden className="mr-3 inline-block h-px w-7 -translate-y-[0.2em] bg-champ" />
            {clip.label}
          </p>
        ))}
      </div>
    </div>
  );
}
