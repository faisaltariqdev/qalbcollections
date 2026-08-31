"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Dialog, DialogTitle, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ProductImageData } from "@/server/catalog-types";

/**
 * Atelier gallery — full poster, never cropped.
 *
 * Click to magnify on desktop; expand opens a native-resolution lightbox.
 * Thumbnails keep the same contain treatment so the house mark stays visible.
 */
export function ProductGallery({
  images,
  productName,
}: {
  images: ProductImageData[];
  productName: string;
}) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const active = images[index];
  const count = images.length;

  const go = useCallback(
    (direction: 1 | -1) => {
      setIndex((current) => (current + direction + count) % count);
      setZoomed(false);
    },
    [count],
  );

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [go, lightboxOpen]);

  if (!active) {
    return (
      <div className="flex aspect-3/4 items-center justify-center border border-champ/25 bg-void">
        <span className="eyebrow text-champ">Photography coming soon</span>
      </div>
    );
  }

  function onPointerMove(event: React.PointerEvent) {
    if (event.pointerType !== "mouse") return;
    const bounds = frameRef.current?.getBoundingClientRect();
    if (!bounds) return;
    setOrigin({
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
    });
  }

  return (
    <figure className="lg:flex lg:gap-4">
      {count > 1 ? (
        <div className="order-2 mt-3 flex gap-2.5 overflow-x-auto lg:order-1 lg:mt-0 lg:w-[4.75rem] lg:shrink-0 lg:flex-col lg:overflow-visible">
          {images.map((image, position) => (
            <button
              key={image.url}
              type="button"
              onClick={() => {
                setIndex(position);
                setZoomed(false);
              }}
              aria-label={`View image ${position + 1} of ${count}: ${image.alt}`}
              aria-current={position === index}
              className={cn(
                "relative aspect-3/4 w-[4.25rem] shrink-0 overflow-hidden border bg-void transition-colors lg:w-full",
                position === index ? "border-champ" : "border-champ/20 hover:border-champ/60",
              )}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="76px"
                quality={75}
                className="object-contain object-center"
              />
            </button>
          ))}
        </div>
      ) : null}

      <div className="order-1 min-w-0 flex-1 lg:order-2">
        <div
          ref={frameRef}
          className="group/frame relative aspect-3/4 w-full overflow-hidden border border-champ/30 bg-void"
          onPointerMove={onPointerMove}
          onPointerLeave={() => setZoomed(false)}
        >
          <Image
            src={active.url}
            alt={active.alt}
            fill
            priority
            quality={100}
            sizes="(max-width: 1024px) 100vw, 48vw"
            className={cn(
              "object-contain object-center transition-transform duration-[700ms] ease-[var(--ease-luxe)]",
              zoomed ? "scale-[2.15]" : "scale-100",
            )}
            style={zoomed ? { transformOrigin: `${origin.x}% ${origin.y}%` } : undefined}
          />

          <button
            type="button"
            onClick={() => setZoomed((current) => !current)}
            className="absolute inset-0 hidden cursor-zoom-in lg:block"
            aria-label={zoomed ? "Reset zoom" : "Magnify image"}
          />

          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="absolute bottom-4 right-4 flex size-10 items-center justify-center border border-champ/40 bg-void/80 text-champ backdrop-blur-sm transition-colors hover:border-champ hover:bg-champ hover:text-void"
            aria-label="View full screen"
          >
            <Expand className="size-4" strokeWidth={1.5} />
          </button>

          {count > 1 ? (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center border border-champ/35 bg-void/75 text-champ opacity-0 backdrop-blur-sm transition-opacity hover:border-champ hover:bg-champ hover:text-void group-hover/frame:opacity-100 focus-visible:opacity-100 max-lg:opacity-100"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next image"
                className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center border border-champ/35 bg-void/75 text-champ opacity-0 backdrop-blur-sm transition-opacity hover:border-champ hover:bg-champ hover:text-void group-hover/frame:opacity-100 focus-visible:opacity-100 max-lg:opacity-100"
              >
                <ChevronRight className="size-4" />
              </button>
            </>
          ) : null}

          <div
            className="absolute left-4 top-4 border border-champ/30 bg-void/70 px-2.5 py-1 text-[0.5625rem] uppercase tracking-[0.18em] text-champ backdrop-blur-sm"
            data-numeric
          >
            {index + 1} / {count}
          </div>
        </div>

        <figcaption className="mt-3 flex items-start justify-between gap-4">
          <p className="max-w-[36ch] text-[0.75rem] leading-relaxed text-dust">{active.alt}</p>
          <p className="hidden shrink-0 text-[0.6875rem] text-faint lg:block">Click to magnify</p>
        </figcaption>
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[min(72rem,calc(100vw-2rem))] border-0 bg-void p-0">
          <DialogTitle className="sr-only">{productName} — full screen images</DialogTitle>
          <div className="relative aspect-3/4 max-h-[86dvh] w-full">
            <Image
              src={active.url}
              alt={active.alt}
              fill
              quality={100}
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="object-contain"
            />
          </div>

          {count > 1 ? (
            <div className="flex items-center justify-center gap-2 border-t border-champ/20 py-4">
              {images.map((image, position) => (
                <button
                  key={image.url}
                  type="button"
                  onClick={() => setIndex(position)}
                  aria-label={`Image ${position + 1}`}
                  aria-current={position === index}
                  className={cn(
                    "h-1 w-8 transition-colors",
                    position === index ? "bg-champ" : "bg-champ/25 hover:bg-champ/50",
                  )}
                />
              ))}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </figure>
  );
}
