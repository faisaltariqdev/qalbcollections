import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

const CATEGORIES = [
  {
    label: "CLASSIC COLLECTION",
    description: "Dress watches with rectangular cases and gold-tone finishing.",
    cta: "EXPLORE",
    href: "/watches",
    image: "/media/lookbook/cartier-tank-hero.jpg",
    imageAlt: "Cartier Tank dress watch on a cream stone plinth",
    titleColor: "text-warm-white",
  },
  {
    label: "SIGNATURE STEEL",
    description: "Automatic travellers and blacked-out bracelets, built to wear daily.",
    cta: "EXPLORE",
    href: "/watches",
    image: "/media/lookbook/tag-heuer-carrera-hero.jpg",
    imageAlt: "TAG Heuer Carrera Twin-Time on a marble pedestal",
    titleColor: "text-warm-white",
  },
  {
    label: "THE HOUSE EDIT",
    description: "Rolex, Hublot, Rado and more — each piece chosen for presence.",
    cta: "VIEW ALL",
    href: "/new-arrivals",
    image: "/media/lookbook/rolex-daydate-hero.jpg",
    imageAlt: "Two-tone Rolex Day-Date on a stone pedestal",
    titleColor: "text-champ",
  },
];

/**
 * Three-column lookbook strip using house campaign photography.
 */
export function CategoryStrip() {
  return (
    <section className="bg-void-soft">
      <div className="mx-auto grid max-w-[1320px] divide-y divide-champ/15 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {CATEGORIES.map((cat, index) => (
          <Link
            key={cat.label}
            href={cat.href}
            className={cn(
              "group relative flex items-center gap-5 overflow-hidden px-5 py-8 transition-colors duration-500 hover:bg-champ/[0.04] sm:px-6 lg:px-8 lg:py-10",
              index === 0 && "sm:border-l sm:border-champ/15",
            )}
          >
            <div className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden border border-champ/20 transition-colors duration-500 group-hover:border-champ/50 sm:w-28 lg:w-32">
              <Image
                src={cat.image}
                alt={cat.imageAlt}
                fill
                quality={85}
                sizes="(max-width: 640px) 33vw, 20vw"
                className="object-contain transition-transform duration-700 ease-[var(--ease-luxe)] group-hover:scale-[1.05]"
              />
            </div>

            <div className="flex flex-col">
              <h2 className={cn("font-display text-[1.25rem] font-normal leading-tight sm:text-[1.125rem] lg:text-[1.35rem]", cat.titleColor)}>
                {cat.label}
              </h2>
              <p className="mt-2 max-w-[18ch] text-[0.8125rem] leading-relaxed text-warm-white/55">
                {cat.description}
              </p>
              <span className="arrow-nudge-parent mt-4 inline-flex items-center gap-1 text-[0.5625rem] font-medium uppercase tracking-[0.18em] text-champ">
                {cat.cta}
                <ChevronRight className="arrow-nudge size-4" strokeWidth={1.5} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
