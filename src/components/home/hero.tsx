"use client";

import Link from "next/link";
import { ChevronRight, Droplets, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const CLIPS = [
  { src: "/media/video/hero-lookbook-a.mp4", eyebrow: "THE HOUSE EDIT", title: "CRAFTED\nIN DETAIL." },
  { src: "/media/video/hero-lookbook-b.mp4", eyebrow: "PRECISION THAT DEFINES YOU", title: "TIME,\nREFINED." },
] as const;

const HOLD_MS = 9000;

/**
 * Cinematic hero — two muted, looping lookbook films crossfade behind the
 * house copy and gold atelier buttons.
 */
export function Hero() {
  const [active, setActive] = useState(0);
  const refs = useRef<Array<HTMLVideoElement | null>>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % CLIPS.length);
    }, HOLD_MS);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    refs.current.forEach((video, index) => {
      if (!video) return;
      video.muted = true;
      video.defaultMuted = true;
      video.volume = 0;
      if (index === active) {
        void video.play().catch(() => {});
      }
    });
  }, [active]);

  const slide = CLIPS[active];
  const titleLines = slide.title.split("\n");

  return (
    <section className="relative isolate -mt-24 flex min-h-[100svh] flex-col overflow-hidden bg-void sm:-mt-28 lg:flex-row lg:items-center">
      <div className="absolute inset-0">
        {CLIPS.map((clip, index) => (
          <video
            key={clip.src}
            ref={(node) => {
              refs.current[index] = node;
            }}
            src={clip.src}
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-[var(--ease-luxe)]"
            style={{ opacity: index === active ? 1 : 0 }}
          />
        ))}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-void via-void/78 to-void/40" />
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-void to-transparent" />
        <div aria-hidden className="grain-layer" />
      </div>

      <div className="shell-x relative z-10 mx-auto flex w-full max-w-[1320px] flex-1 flex-col justify-center pb-16 pt-28 sm:pt-32 lg:pb-24">
        <div className="max-w-xl">
          <p
            key={`eyebrow-${slide.src}`}
            className="eyebrow animate-fade-in text-champ tracking-[0.34em]"
          >
            {slide.eyebrow}
          </p>

          <h1
            className="mt-5 font-display font-normal uppercase leading-[0.94] tracking-[-0.02em] text-warm-white lg:mt-6"
            style={{ fontSize: "clamp(2.75rem, 10vw, 7rem)" }}
          >
            {titleLines.map((line, index) => (
              <span key={`${slide.src}-${line}`} className="block overflow-hidden pb-[0.16em]">
                <span
                  className="block animate-rise-up"
                  style={{ animationDelay: `${180 + index * 140}ms` }}
                >
                  {line}
                </span>
              </span>
            ))}
          </h1>

          <div className="diamond-rule mt-6 max-w-xs" aria-hidden>
            <span />
          </div>

          <p className="mt-5 max-w-md animate-fade-up text-[0.95rem] leading-[1.85] text-warm-white/75">
            A private atelier of timepieces — gold, steel and ceramic — selected for proportion,
            finishing and the way they wear in Pakistan.
          </p>

          <div className="mt-8 flex animate-fade-up flex-wrap items-center gap-4">
            <Link
              href="/watches"
              className="group btn-gild arrow-nudge-parent inline-flex items-center gap-3 px-8 py-4 text-[0.8125rem] font-semibold uppercase tracking-[0.14em] transition-transform duration-400 hover:-translate-y-px"
            >
              Explore the collection
              <ChevronRight className="arrow-nudge size-4" strokeWidth={1.5} />
            </Link>
            <Link
              href="/new-arrivals"
              className="group arrow-nudge-parent inline-flex items-center gap-3 border border-champ px-8 py-4 text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-champ transition-all duration-400 hover:bg-champ hover:text-void"
            >
              Shop the latest
              <ChevronRight className="arrow-nudge size-4" strokeWidth={1.5} />
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-champ">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="size-4" strokeWidth={1.5} />
              <span className="text-[0.75rem] font-semibold uppercase tracking-[0.12em]">6 month machine warranty</span>
            </span>
            <span className="hidden h-4 w-px bg-champ/40 sm:block" aria-hidden />
            <span className="inline-flex items-center gap-2">
              <Droplets className="size-4" strokeWidth={1.5} />
              <span className="text-[0.75rem] font-semibold uppercase tracking-[0.12em]">Water resistant</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
