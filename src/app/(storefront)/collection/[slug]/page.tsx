import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductListing } from "@/components/listing/product-listing";
import { JsonLd } from "@/components/seo/json-ld";
import { buildMetadata, paginationCanonical, shouldNoIndexListing } from "@/lib/seo/metadata";
import { collectionPageSchema } from "@/lib/seo/structured-data";
import { getCollectionBySlug } from "@/server/catalog";
import { buildListing } from "@/server/listing-page";

/**
 * Rendered per request rather than prerendered: the page reads filter and page
 * search params, which a cached variant cannot represent, and an unknown slug
 * has to be able to answer with a 404 before the response is committed.
 */
export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { slug } = await params;
  const query = await searchParams;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return {};

  const page = Number.parseInt(String(query.page ?? "1"), 10) || 1;
  const path = `/collection/${slug}`;

  return buildMetadata({
    title: collection.seoTitle ?? collection.name,
    description:
      collection.seoDescription ??
      collection.description ??
      `${collection.name} — a curated edit from Qalb Collections.`,
    path,
    canonicalPath: paginationCanonical(path, page),
    image: collection.ogImageUrl ?? collection.imageUrl,
    noIndex: collection.noIndex || shouldNoIndexListing(query),
  });
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const basePath = `/collection/${slug}`;
  const listing = await buildListing({
    searchParams: query,
    overrides: { collectionSlug: slug },
  });

  return (
    <>
      <Breadcrumbs
        crumbs={[
          { name: "Collections", path: "/collections" },
          { name: collection.name, path: basePath },
        ]}
      />

      <ProductListing
        eyebrow="Collection"
        title={collection.name}
        description={collection.description}
        editorialIntro={collection.editorialIntro}
        basePath={basePath}
        searchParams={query}
        products={listing.products}
        facets={listing.facets}
        total={listing.total}
        page={listing.page}
        pageCount={listing.pageCount}
        sort={listing.sort}
        currency={listing.currency}
        emptyTitle="This edit is being rebuilt"
        emptyDescription="Nothing is assigned to this collection right now. Explore the full catalogue in the meantime."
      />

      <JsonLd
        data={collectionPageSchema({
          name: collection.name,
          description: collection.description ?? "",
          path: basePath,
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
