import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductListing } from "@/components/listing/product-listing";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, shouldNoIndexListing } from "@/lib/seo/metadata";
import { collectionPageSchema } from "@/lib/seo/structured-data";
import { buildListing } from "@/server/listing-page";

export const revalidate = 300;

const BASE_PATH = "/best-sellers";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  return buildMetadata({
    title: "Best Sellers",
    description:
      "The pieces chosen most often at Qalb Collections — the watches our customers keep coming back to.",
    path: BASE_PATH,
    noIndex: shouldNoIndexListing(await searchParams),
  });
}

export default async function BestSellersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const listing = await buildListing({
    searchParams: params,
    overrides: { flags: { bestseller: true }, includeComingSoon: false },
  });

  return (
    <>
      <Breadcrumbs crumbs={[{ name: "Best sellers", path: BASE_PATH }]} />

      <ProductListing
        eyebrow="Most chosen"
        title="Best sellers"
        description="Not the most heavily marketed — the ones people actually take home."
        basePath={BASE_PATH}
        searchParams={params}
        products={listing.products}
        facets={listing.facets}
        total={listing.total}
        page={listing.page}
        pageCount={listing.pageCount}
        sort={listing.sort}
        currency={listing.currency}
        emptyTitle="No bestsellers marked yet"
        emptyDescription="Browse the full collection while we work out what people love most."
      />
      <JsonLd
        data={collectionPageSchema({
          name: "Best sellers",
          description: "The pieces Qalb Collections customers choose most often.",
          path: "/best-sellers",
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
