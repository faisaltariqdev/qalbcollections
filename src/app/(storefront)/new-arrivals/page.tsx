import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductListing } from "@/components/listing/product-listing";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, shouldNoIndexListing } from "@/lib/seo/metadata";
import { collectionPageSchema } from "@/lib/seo/structured-data";
import { buildListing } from "@/server/listing-page";

export const revalidate = 300;

const BASE_PATH = "/new-arrivals";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  return buildMetadata({
    title: "New Arrivals",
    description:
      "The most recent additions to the Qalb Collections catalogue — new watches, in stock now.",
    path: BASE_PATH,
    noIndex: shouldNoIndexListing(await searchParams),
  });
}

export default async function NewArrivalsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  // "New in" is an editor flag rather than a date window, so a piece stays new
  // for as long as the merchandiser says it is.
  const listing = await buildListing({
    searchParams: params,
    overrides: { flags: { newArrival: true }, includeComingSoon: false },
  });

  return (
    <>
      <Breadcrumbs crumbs={[{ name: "New arrivals", path: BASE_PATH }]} />

      <ProductListing
        eyebrow="Just in"
        title="New arrivals"
        description="Recently added to the collection. Each piece is here because it earned a place, not to fill the grid."
        basePath={BASE_PATH}
        searchParams={params}
        products={listing.products}
        facets={listing.facets}
        total={listing.total}
        page={listing.page}
        pageCount={listing.pageCount}
        sort={listing.sort}
        currency={listing.currency}
        emptyTitle="Nothing new right now"
        emptyDescription="Everything currently in stock has been here a while. Join the list and we will tell you when that changes."
      />
      <JsonLd
        data={collectionPageSchema({
          name: "New arrivals",
          description: "The most recent additions to the Qalb Collections catalogue.",
          path: "/new-arrivals",
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
