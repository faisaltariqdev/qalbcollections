import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductListing } from "@/components/listing/product-listing";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, paginationCanonical, shouldNoIndexListing } from "@/lib/seo/metadata";
import { collectionPageSchema } from "@/lib/seo/structured-data";
import { getCategoryBySlug } from "@/server/catalog";
import { buildListing } from "@/server/listing-page";

/**
 * The primary category landing page.
 *
 * `/watches` is a stable, memorable URL, so it is the canonical home for the
 * category rather than `/category/watches` — that route redirects here.
 */

export const revalidate = 300;

const CATEGORY_SLUG = "watches";
const BASE_PATH = "/watches";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const category = await getCategoryBySlug(CATEGORY_SLUG);
  if (!category) return {};

  const page = Number.parseInt(String(params.page ?? "1"), 10) || 1;

  return buildMetadata({
    title:
      category.seoTitle ?? (page > 1 ? `Luxury watches — page ${page}` : "Luxury watches in Pakistan"),
    description:
      category.seoDescription ??
      category.description ??
      "A curated selection of premium watches at Qalb Collections, chosen for proportion, legibility and finishing. Photographed as the piece you receive. Delivery across Pakistan.",
    path: BASE_PATH,
    canonicalPath: paginationCanonical(BASE_PATH, page),
    image: category.ogImageUrl ?? category.imageUrl,
    // Facet permutations are near-duplicates; only the clean view is indexed.
    noIndex: category.noIndex || shouldNoIndexListing(params),
  });
}

export default async function WatchesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const category = await getCategoryBySlug(CATEGORY_SLUG);
  if (!category) notFound();

  const listing = await buildListing({
    searchParams: params,
    overrides: { categorySlug: CATEGORY_SLUG },
  });

  return (
    <>
      <Breadcrumbs crumbs={[{ name: "Watches", path: BASE_PATH }]} />

      <ProductListing
        eyebrow="The collection"
        title={category.name}
        description={category.description}
        editorialIntro={category.editorialIntro}
        basePath={BASE_PATH}
        searchParams={params}
        products={listing.products}
        facets={listing.facets}
        total={listing.total}
        page={listing.page}
        pageCount={listing.pageCount}
        sort={listing.sort}
        currency={listing.currency}
      />

      <JsonLd
        data={collectionPageSchema({
          name: category.name,
          description:
            category.description ??
            "A curated selection of premium watches at Qalb Collections.",
          path: BASE_PATH,
          items: listing.products.map((product) => ({
            name: product.name,
            slug: product.slug,
            brand: product.brand,
            image: product.primaryImage?.url ?? null,
          })),
        })}
      />
    </>
  );
}
