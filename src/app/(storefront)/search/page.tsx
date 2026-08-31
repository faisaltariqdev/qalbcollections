import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductListing } from "@/components/listing/product-listing";
import { ProductGrid } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import {
  Container,
  EmptyState,
  Eyebrow,
  GiltRule,
  Section,
  SectionHeading,
} from "@/components/ui/primitives";
import { buildMetadata } from "@/lib/seo/metadata";
import type { RawSearchParams } from "@/lib/product-query";
import { listCurated } from "@/server/catalog";
import { buildListing } from "@/server/listing-page";
import { getSearchSuggestions, logSearch, popularSearches } from "@/server/search";

/**
 * Search results.
 *
 * Server-rendered so a result set can be linked and shared, and so search works
 * with JavaScript unavailable. Results are never indexed — they are a view of
 * the catalogue, not a page of their own.
 */

export const metadata: Metadata = buildMetadata({
  title: "Search",
  description: "Search the Qalb Collections catalogue by name, brand, reference or detail.",
  path: "/search",
  noIndex: true,
});

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const raw = params.q;
  const term = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";

  if (term.length < 2) {
    const popular = await popularSearches();
    return (
      <>
        <Breadcrumbs crumbs={[{ name: "Search", path: "/search" }]} />
        <Section spacing="default">
          <Container size="narrow">
            <Eyebrow className="text-qalb">Search</Eyebrow>
            <h1 className="mt-5 text-display-lg text-ink">What are you looking for?</h1>
            <GiltRule className="mt-7" />
            <p className="mt-7 text-base leading-relaxed text-muted">
              Search by brand, model, reference number, or a detail you remember — a black dial, a
              leather strap, an automatic movement.
            </p>

            <form action="/search" method="get" className="mt-10 flex gap-3">
              <input
                type="search"
                name="q"
                autoFocus
                placeholder="Cartier, automatic, 40mm…"
                aria-label="Search the catalogue"
                className="h-14 flex-1 border border-line bg-canvas px-4 text-sm text-ink outline-none placeholder:text-faint focus-visible:border-ink"
              />
              <Button type="submit" size="lg">
                Search
              </Button>
            </form>

            {popular.length > 0 ? (
              <div className="mt-10">
                <p className="eyebrow text-faint">Frequently searched</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {popular.map((entry) => (
                    <Link
                      key={entry}
                      href={`/search?q=${encodeURIComponent(entry)}`}
                      className="border border-line px-3.5 py-2 text-xs text-ink-soft transition-colors hover:border-ink"
                    >
                      {entry}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </Container>
        </Section>
      </>
    );
  }

  const listing = await buildListing({ searchParams: params, overrides: { search: term } });
  await logSearch(term, listing.total);

  if (listing.total === 0) {
    const [suggestions, alternatives] = await Promise.all([
      getSearchSuggestions(term),
      listCurated("featured", 4),
    ]);

    return (
      <>
        <Breadcrumbs crumbs={[{ name: "Search", path: "/search" }]} />

        <Section spacing="tight">
          <Container>
            <Eyebrow className="text-qalb">Search</Eyebrow>
            <h1 className="mt-5 text-display-md text-ink">
              Nothing matched &ldquo;{term}&rdquo;
            </h1>
            <GiltRule className="mt-7" />

            <EmptyState
              className="mt-10"
              icon={<SearchX className="size-10" strokeWidth={1} />}
              title="No pieces found"
              description={
                suggestions.didYouMean
                  ? `Try searching for ${suggestions.didYouMean} instead, or browse the catalogue.`
                  : "Try a shorter search — a brand name, or a single detail like “automatic” or “leather”."
              }
              actions={
                <>
                  {suggestions.didYouMean ? (
                    <Button asChild variant="primary">
                      <Link href={`/search?q=${encodeURIComponent(suggestions.didYouMean)}`}>
                        Search {suggestions.didYouMean}
                      </Link>
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
          </Container>
        </Section>

        {alternatives.length > 0 ? (
          <Section tone="shell" spacing="tight">
            <Container>
              <SectionHeading eyebrow="You may prefer" title="Currently curated" level={2} />
              <div className="mt-10">
                <ProductGrid products={alternatives} columns={4} size="compact" />
              </div>
            </Container>
          </Section>
        ) : null}
      </>
    );
  }

  return (
    <>
      <Breadcrumbs crumbs={[{ name: "Search", path: "/search" }]} />
      <ProductListing
        eyebrow="Search results"
        title={`“${term}”`}
        description={`${listing.total} ${listing.total === 1 ? "piece matches" : "pieces match"} your search.`}
        basePath="/search"
        searchParams={params}
        products={listing.products}
        facets={listing.facets}
        total={listing.total}
        page={listing.page}
        pageCount={listing.pageCount}
        sort={listing.sort}
        currency={listing.currency}
        emptyTitle="Nothing matches those filters"
        emptyDescription="Your search found pieces, but the filters narrowed them out."
      />
    </>
  );
}
