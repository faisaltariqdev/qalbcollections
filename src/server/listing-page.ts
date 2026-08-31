import { getFacets, listProducts } from "@/server/catalog";
import { parseProductQuery, type RawSearchParams } from "@/lib/product-query";
import { getSiteSettings } from "@/lib/settings";
import type { ProductQuery } from "@/server/catalog-types";

/**
 * Assembles everything a listing page renders from its URL.
 *
 * Every listing route funnels through here, so URL parsing, currency
 * resolution, facet building and pagination behave identically across
 * categories, collections, edits and search.
 */
export async function buildListing({
  searchParams,
  overrides = {},
  perPage,
}: {
  searchParams: RawSearchParams;
  overrides?: Partial<ProductQuery>;
  perPage?: number;
}) {
  const settings = await getSiteSettings();

  const query: ProductQuery = {
    ...parseProductQuery(searchParams, {
      currency: settings.currency,
      perPage,
    }),
    ...overrides,
  };

  const [result, facets] = await Promise.all([listProducts(query), getFacets(query)]);

  return {
    ...result,
    facets,
    sort: query.sort ?? "featured",
    currency: settings.currency,
    settings,
  };
}
