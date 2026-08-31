import { PRODUCTS_PER_PAGE } from "@/lib/constants";
import { toMajorUnits, toMinorUnits } from "@/lib/money";
import { isSortValue, type ProductQuery } from "@/server/catalog-types";

/**
 * The URL is the source of truth for listing state.
 *
 * Filters, sort and page live in the query string so every view is shareable,
 * back-button-correct and server-renderable — no client-side filter store.
 * These helpers are pure, which also makes them the easiest part of the app to
 * unit test.
 */

export type RawSearchParams = Record<string, string | string[] | undefined>;

const ATTRIBUTE_PREFIX = "attr_";
/** Prices appear in the URL as major units (rupees) for legibility. */
const PRICE_MIN = "price_min";
const PRICE_MAX = "price_max";

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  const values = Array.isArray(value) ? value : value.split(",");
  return values.map((entry) => entry.trim()).filter(Boolean);
}

function toPositiveInt(value: string | string[] | undefined): number | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return undefined;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export interface ParseOptions {
  categorySlug?: string;
  collectionSlug?: string;
  currency?: string;
  perPage?: number;
  includeComingSoon?: boolean;
}

export function parseProductQuery(
  params: RawSearchParams,
  options: ParseOptions = {},
): ProductQuery {
  const attributes: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(params)) {
    if (!key.startsWith(ATTRIBUTE_PREFIX)) continue;
    const values = toArray(value);
    if (values.length > 0) attributes[key.slice(ATTRIBUTE_PREFIX.length)] = values;
  }

  const sortParam = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  const priceMinMajor = toPositiveInt(params[PRICE_MIN]);
  const priceMaxMajor = toPositiveInt(params[PRICE_MAX]);
  const currency = options.currency ?? "PKR";
  const searchTerm = Array.isArray(params.q) ? params.q[0] : params.q;

  return {
    categorySlug: options.categorySlug,
    collectionSlug: options.collectionSlug,
    tagSlugs: toArray(params.tag),
    brands: toArray(params.brand),
    priceMin: priceMinMajor !== undefined ? toMinorUnits(priceMinMajor, currency) : undefined,
    priceMax: priceMaxMajor !== undefined ? toMinorUnits(priceMaxMajor, currency) : undefined,
    inStockOnly: toArray(params.availability).includes("in-stock"),
    attributes,
    search: searchTerm?.trim() || undefined,
    sort: isSortValue(sortParam) ? sortParam : "featured",
    page: toPositiveInt(params.page) ?? 1,
    perPage: options.perPage ?? PRODUCTS_PER_PAGE,
    includeComingSoon: options.includeComingSoon ?? true,
  };
}

/** Keys this module owns; anything else in the URL is left untouched. */
const FILTER_KEYS = ["brand", "availability", "tag", PRICE_MIN, PRICE_MAX];

function isFilterKey(key: string) {
  return FILTER_KEYS.includes(key) || key.startsWith(ATTRIBUTE_PREFIX);
}

export function searchParamsToUrlSearchParams(params: RawSearchParams) {
  const result = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    for (const entry of toArray(value)) result.append(key, entry);
  }
  return result;
}

function stringify(params: URLSearchParams) {
  params.delete("page"); // Any filter or sort change returns to page one.
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function toggleFacetHref(
  basePath: string,
  params: RawSearchParams,
  param: string,
  value: string,
) {
  const next = searchParamsToUrlSearchParams(params);
  const existing = next.getAll(param);
  next.delete(param);
  for (const entry of existing) {
    if (entry !== value) next.append(param, entry);
  }
  if (!existing.includes(value)) next.append(param, value);
  return `${basePath}${stringify(next)}`;
}

export function setPriceHref(
  basePath: string,
  params: RawSearchParams,
  min: number | null,
  max: number | null,
  currency = "PKR",
) {
  const next = searchParamsToUrlSearchParams(params);
  next.delete(PRICE_MIN);
  next.delete(PRICE_MAX);
  if (min !== null) next.set(PRICE_MIN, String(Math.round(toMajorUnits(min, currency))));
  if (max !== null) next.set(PRICE_MAX, String(Math.round(toMajorUnits(max, currency))));
  return `${basePath}${stringify(next)}`;
}

export function setSortHref(basePath: string, params: RawSearchParams, sort: string) {
  const next = searchParamsToUrlSearchParams(params);
  if (sort === "featured") next.delete("sort");
  else next.set("sort", sort);
  return `${basePath}${stringify(next)}`;
}

export function setPageHref(basePath: string, params: RawSearchParams, page: number) {
  const next = searchParamsToUrlSearchParams(params);
  if (page <= 1) next.delete("page");
  else next.set("page", String(page));
  const query = next.toString();
  return `${basePath}${query ? `?${query}` : ""}`;
}

export function clearFiltersHref(basePath: string, params: RawSearchParams) {
  const next = searchParamsToUrlSearchParams(params);
  for (const key of [...next.keys()]) {
    if (isFilterKey(key)) next.delete(key);
  }
  return `${basePath}${stringify(next)}`;
}

export function hasActiveFilters(params: RawSearchParams) {
  return Object.entries(params).some(([key, value]) => isFilterKey(key) && toArray(value).length > 0);
}

export function countActiveFilters(params: RawSearchParams) {
  return Object.entries(params).reduce((total, [key, value]) => {
    if (!isFilterKey(key)) return total;
    if (key === PRICE_MIN || key === PRICE_MAX) return total;
    return total + toArray(value).length;
  }, 0) + (params[PRICE_MIN] || params[PRICE_MAX] ? 1 : 0);
}

export interface FilterChip {
  label: string;
  href: string;
}

/** Removable chips summarising the active filters above the grid. */
export function activeFilterChips(
  basePath: string,
  params: RawSearchParams,
  facetLabels: Record<string, string>,
  formatPrice: (minor: number) => string,
  currency = "PKR",
): FilterChip[] {
  const chips: FilterChip[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (!isFilterKey(key) || key === PRICE_MIN || key === PRICE_MAX) continue;
    for (const entry of toArray(value)) {
      const prefix = facetLabels[key];
      chips.push({
        label: prefix ? `${prefix}: ${entry}` : entry,
        href: toggleFacetHref(basePath, params, key, entry),
      });
    }
  }

  const minMajor = toPositiveInt(params[PRICE_MIN]);
  const maxMajor = toPositiveInt(params[PRICE_MAX]);
  if (minMajor !== undefined || maxMajor !== undefined) {
    const from = minMajor !== undefined ? formatPrice(toMinorUnits(minMajor, currency)) : null;
    const to = maxMajor !== undefined ? formatPrice(toMinorUnits(maxMajor, currency)) : null;
    chips.push({
      label: from && to ? `${from} – ${to}` : from ? `From ${from}` : `Up to ${to}`,
      href: setPriceHref(basePath, params, null, null, currency),
    });
  }

  return chips;
}
