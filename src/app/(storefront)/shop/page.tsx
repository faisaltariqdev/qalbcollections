import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductListing } from "@/components/listing/product-listing";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, paginationCanonical, shouldNoIndexListing } from "@/lib/seo/metadata";
import { collectionPageSchema } from "@/lib/seo/structured-data";
import { buildListing } from "@/server/listing-page";

/** Everything published, across every category. */

export const revalidate = 300;

const BASE_PATH = "/shop";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const page = Number.parseInt(String(params.page ?? "1"), 10) || 1;

  return buildMetadata({
    title: page > 1 ? `Shop luxury watches — page ${page}` : "Shop luxury watches in Pakistan",
    description:
      "Browse the Qalb Collections catalogue of premium watches. Each listing is photographed as the piece you receive. Filter by brand, movement and price. Boxed, warrantied, cash on delivery across Pakistan.",
    path: BASE_PATH,
    canonicalPath: paginationCanonical(BASE_PATH, page),
    noIndex: shouldNoIndexListing(params),
  });
}

export default async function ShopPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const listing = await buildListing({ searchParams: params, perPage: 16 });

  return (
    <>
      <Breadcrumbs crumbs={[{ name: "Shop", path: BASE_PATH }]} />

      <ProductListing
        eyebrow="Everything"
        title="Shop all"
        description="The full catalogue — newest and most-chosen first. Filter by brand, movement, size or price. Hover any card for the detail photograph, then add to bag."
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
          name: "Shop all",
          description:
            "The full Qalb Collections catalogue of premium watches. Photographed as the piece you receive.",
          path: "/shop",
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
