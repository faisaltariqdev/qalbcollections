import Link from "next/link";
import { SearchX, X } from "lucide-react";

import { ListingGuide } from "@/components/listing/listing-guide";
import { FilterRail } from "@/components/listing/filter-rail";
import { ListingToolbar } from "@/components/listing/listing-toolbar";
import { Pagination } from "@/components/listing/pagination";
import { ProductGrid } from "@/components/product/product-card";
import { JsonLdGraph } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { Container, EmptyState, Eyebrow } from "@/components/ui/primitives";
import { formatMoney } from "@/lib/money";
import {
  activeFilterChips,
  clearFiltersHref,
  countActiveFilters,
  hasActiveFilters,
  type RawSearchParams,
} from "@/lib/product-query";
import { listingHowToSchema } from "@/lib/seo/structured-data";
import type { Facet, ProductCardData } from "@/server/catalog-types";

/**
 * Shared listing shell used by every category, collection and edit page.
 *
 * Explains how the grid works, keeps filters as real links (crawlable, shareable)
 * and shows full atelier posters at equal height so quality is visible, not cropped.
 */
export function ProductListing({
  eyebrow,
  title,
  description,
  editorialIntro,
  basePath,
  searchParams,
  products,
  facets,
  total,
  page,
  pageCount,
  sort,
  currency,
  emptyTitle = "Nothing matches those filters",
  emptyDescription = "Try removing a filter, or explore the full collection.",
}: {
  eyebrow?: string;
  title: string;
  description?: string | null;
  editorialIntro?: string | null;
  basePath: string;
  searchParams: RawSearchParams;
  products: ProductCardData[];
  facets: Facet[];
  total: number;
  page: number;
  pageCount: number;
  sort: string;
  currency: string;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  const filtersActive = hasActiveFilters(searchParams);
  const facetLabels = Object.fromEntries(facets.map((facet) => [facet.param, facet.label]));
  const chips = activeFilterChips(
    basePath,
    searchParams,
    facetLabels,
    (minor) => formatMoney(minor, currency),
    currency,
  );

  const rail = (
    <FilterRail
      facets={facets}
      basePath={basePath}
      searchParams={searchParams}
      currency={currency}
      hasFilters={filtersActive}
    />
  );

  return (
    <>
      <header className="border-b border-ink/10 bg-nav">
        <Container className="py-14 sm:py-16">
          <div className="max-w-3xl">
            {eyebrow ? <Eyebrow className="text-burgundy">{eyebrow}</Eyebrow> : null}
            <h1 className="mt-4 font-display text-[clamp(2.25rem,5vw,4rem)] font-normal leading-[1.02] tracking-[-0.02em] text-ink">
              {title}
            </h1>
            <div className="diamond-rule mt-7 max-w-[8rem]" aria-hidden>
              <span />
            </div>
            {description ? (
              <p className="mt-7 max-w-2xl text-base leading-relaxed text-ink-soft">{description}</p>
            ) : null}
            {editorialIntro ? (
              <p className="mt-5 max-w-2xl text-sm leading-loose text-dust">{editorialIntro}</p>
            ) : null}
            <p className="mt-6 text-sm text-dust" data-numeric>
              {total} {total === 1 ? "piece" : "pieces"} currently available. Hover a card for the
              detail photograph — then add to bag without leaving the grid.
            </p>
          </div>
        </Container>
      </header>

      <ListingGuide />

      <div className="bg-cream">
        <Container className="py-10 lg:py-14">
          <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14 xl:grid-cols-[16.5rem_minmax(0,1fr)]">
            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <p className="mb-5 text-[0.75rem] leading-relaxed text-dust">
                  Narrow by brand, movement, size or price. Every filter is a link you can share.
                </p>
                {rail}
              </div>
            </aside>

            <div>
              <ListingToolbar
                basePath={basePath}
                searchParams={searchParams}
                currentSort={sort}
                total={total}
                activeFilterCount={countActiveFilters(searchParams)}
                filterRail={rail}
              />

              {chips.length > 0 ? (
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  {chips.map((chip) => (
                    <Link
                      key={chip.label}
                      href={chip.href}
                      scroll={false}
                      className="group inline-flex items-center gap-2 border border-line bg-nav py-1.5 pl-3 pr-2 text-xs text-ink-soft transition-colors hover:border-ink"
                    >
                      {chip.label}
                      <X className="size-3 text-faint transition-colors group-hover:text-ink" />
                      <span className="sr-only">Remove filter</span>
                    </Link>
                  ))}
                  <Link
                    href={clearFiltersHref(basePath, searchParams)}
                    scroll={false}
                    className="ml-1 text-xs text-burgundy underline decoration-burgundy/40 underline-offset-4 hover:decoration-burgundy"
                  >
                    Clear all
                  </Link>
                </div>
              ) : null}

              {products.length === 0 ? (
                <EmptyState
                  className="mt-10"
                  icon={<SearchX className="size-10" strokeWidth={1} />}
                  title={emptyTitle}
                  description={emptyDescription}
                  actions={
                    <>
                      {filtersActive ? (
                        <Button asChild variant="primary">
                          <Link href={clearFiltersHref(basePath, searchParams)}>Clear filters</Link>
                        </Button>
                      ) : null}
                      <Button asChild variant="outline">
                        <Link href="/watches">Browse all watches</Link>
                      </Button>
                      <Button asChild variant="ghost">
                        <Link href="/find-your-timepiece">Find your timepiece</Link>
                      </Button>
                    </>
                  }
                />
              ) : (
                <>
                  <p className="mt-8 text-xs uppercase tracking-[0.16em] text-dust" data-numeric>
                    {pageCount > 1
                      ? `Page ${page} of ${pageCount} · ${products.length} on this page · ${total} in total`
                      : `${total} ${total === 1 ? "piece" : "pieces"}`}
                  </p>
                  <div className="mt-6">
                    <ProductGrid products={products} columns={3} priorityCount={3} />
                  </div>
                  <Pagination
                    basePath={basePath}
                    searchParams={searchParams}
                    page={page}
                    pageCount={pageCount}
                  />
                </>
              )}
            </div>
          </div>
        </Container>
      </div>

      <JsonLdGraph items={[listingHowToSchema()]} />
    </>
  );
}
