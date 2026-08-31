import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { ArrivalCarousel } from "@/components/product/arrival-carousel";
import type { ProductCardData } from "@/server/catalog-types";

/**
 * New Arrivals — cream atelier rail with gold titles.
 */
export function NewArrivals({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) return null;

  return (
    <section className="bg-cream py-14 sm:py-18 lg:py-20">
      <div className="shell-x mx-auto max-w-[1320px]">
        <div className="mb-8 lg:mb-0 lg:flex lg:items-start lg:justify-between lg:gap-12">
          <div className="shrink-0 lg:w-56">
            <p className="eyebrow text-burgundy tracking-[0.26em]">NEW ARRIVALS</p>
            <h2 className="mt-3 font-display text-[2.5rem] font-normal leading-[0.95] text-ink sm:text-[3rem] lg:text-[3.25rem]">
              The Latest<br />Additions
            </h2>
            <div className="diamond-rule mt-5 max-w-[8rem]" aria-hidden>
              <span />
            </div>
            <p className="mt-5 max-w-[22ch] text-sm leading-relaxed text-dust">
              Hover any piece to study the dial, clasp and case — the same photographs used in our atelier posters.
            </p>
            <Link
              href="/new-arrivals"
              className="arrow-nudge-parent mt-5 inline-flex items-center gap-1.5 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-ink transition-colors duration-300 hover:text-burgundy"
            >
              VIEW ALL WATCHES
              <ChevronRight className="arrow-nudge size-4" strokeWidth={1.5} />
            </Link>
          </div>

          <div className="mt-8 w-full lg:mt-2 lg:max-w-[calc(100%-15rem)]">
            <ArrivalCarousel products={products} />
          </div>
        </div>
      </div>
    </section>
  );
}
