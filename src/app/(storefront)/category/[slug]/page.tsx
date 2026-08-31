import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductListing } from "@/components/listing/product-listing";
import { JsonLd } from "@/components/seo/json-ld";
import { DEDICATED_CATEGORY_ROUTES } from "@/lib/routes";
import { buildMetadata, paginationCanonical, shouldNoIndexListing } from "@/lib/seo/metadata";
import { collectionPageSchema } from "@/lib/seo/structured-data";
import { getCategoryBySlug } from "@/server/catalog";
import { buildListing } from "@/server/listing-page";

/**
 * Generic category page.
 *
 * Categories with a dedicated top-level route (watches, perfumes) redirect there
 * permanently, so there is exactly one indexable URL per category and no
 * duplicate content.
 */

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
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  const page = Number.parseInt(String(query.page ?? "1"), 10) || 1;
  const path = `/category/${slug}`;

  return buildMetadata({
    title: category.seoTitle ?? (page > 1 ? `${category.name} — page ${page}` : category.name),
    description:
      category.seoDescription ??
      category.description ??
      `Browse ${category.name} at Qalb Collections.`,
    path,
    canonicalPath: paginationCanonical(path, page),
    image: category.ogImageUrl ?? category.imageUrl,
    noIndex: category.noIndex || shouldNoIndexListing(query),
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const query = await searchParams;

  const dedicated = DEDICATED_CATEGORY_ROUTES[slug];
  if (dedicated) permanentRedirect(dedicated);

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const basePath = `/category/${slug}`;
  const listing = await buildListing({
    searchParams: query,
    overrides: { categorySlug: slug },
  });

  return (
    <>
      <Breadcrumbs
        crumbs={[
          { name: "Shop", path: "/shop" },
          { name: category.name, path: basePath },
        ]}
      />

      <ProductListing
        eyebrow="Category"
        title={category.name}
        description={category.description}
        editorialIntro={category.editorialIntro}
        basePath={basePath}
        searchParams={query}
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
          description: category.description ?? "",
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
