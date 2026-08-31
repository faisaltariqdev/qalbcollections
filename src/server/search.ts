import type { Prisma } from "@prisma/client";

import { db } from "@/lib/db";

/**
 * Search.
 *
 * Vendor-free by design: this is plain SQL through Prisma behind a narrow
 * interface, so swapping in Meilisearch or Typesense later means replacing this
 * module, not the UI.
 *
 * Ranking is deliberate rather than incidental — an exact brand or SKU match
 * outranks a description mention, because "Seiko" should return Seikos.
 */

const STOP_WORDS = new Set(["the", "a", "an", "and", "for", "with", "of", "in", "on", "my"]);

/** Query words that map onto catalogue vocabulary a shopper would not know. */
const SYNONYMS: Record<string, string[]> = {
  gold: ["gold-tone", "gold"],
  golden: ["gold-tone", "gold"],
  silver: ["silver", "steel", "silver-white"],
  steel: ["steel", "stainless"],
  black: ["black"],
  white: ["white", "silver-white"],
  grey: ["anthracite", "grey"],
  gray: ["anthracite", "grey"],
  brown: ["brown"],
  leather: ["leather", "calf"],
  bracelet: ["bracelet", "steel"],
  strap: ["strap", "leather"],
  auto: ["automatic"],
  automatic: ["automatic"],
  mechanical: ["automatic"],
  quartz: ["quartz"],
  battery: ["quartz"],
  gmt: ["twin-time", "second time zone"],
  dress: ["dress", "formal"],
  square: ["rectangular"],
  rectangle: ["rectangular"],
  mens: ["men"],
  womens: ["women", "unisex"],
  ladies: ["women", "unisex"],
  waterproof: ["water resistance"],
  diver: ["water resistance"],
};

export function tokenize(term: string): string[] {
  return term
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function expand(token: string): string[] {
  return SYNONYMS[token] ?? [token];
}

/** Fields a token may match, in descending order of how much it counts. */
function tokenClause(token: string): Prisma.ProductWhereInput {
  const variants = expand(token);
  return {
    OR: variants.flatMap((variant) => [
      { name: { contains: variant } },
      { brand: { contains: variant } },
      { sku: { contains: variant } },
      { shortDescription: { contains: variant } },
      { description: { contains: variant } },
      { category: { name: { contains: variant } } },
      { attributes: { some: { value: { contains: variant } } } },
      { collections: { some: { collection: { name: { contains: variant } } } } },
      { tags: { some: { tag: { label: { contains: variant } } } } },
    ]),
  };
}

const PUBLISHED: Prisma.ProductWhereInput = {
  status: "ACTIVE",
  category: { status: { in: ["ACTIVE", "COMING_SOON"] } },
};

export interface SearchHit {
  id: string;
  name: string;
  slug: string;
  brand: string;
  sku: string;
  price: number;
  currency: string;
  categoryName: string;
  comingSoon: boolean;
  inStock: boolean;
  imageUrl: string | null;
  imageAlt: string;
  score: number;
}

export interface SearchSuggestions {
  term: string;
  products: SearchHit[];
  brands: { name: string; count: number }[];
  categories: { name: string; slug: string }[];
  collections: { name: string; slug: string }[];
  /** Set when the original query returned nothing and a looser pass was used. */
  didYouMean: string | null;
  total: number;
}

const HIT_SELECT = {
  id: true,
  name: true,
  slug: true,
  brand: true,
  sku: true,
  price: true,
  currency: true,
  stock: true,
  allowBackorder: true,
  comingSoon: true,
  featured: true,
  category: { select: { name: true } },
  images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
} satisfies Prisma.ProductSelect;

type HitRow = Prisma.ProductGetPayload<{ select: typeof HIT_SELECT }>;

function scoreRow(row: HitRow, tokens: string[]): number {
  const name = row.name.toLowerCase();
  const brand = row.brand.toLowerCase();
  const sku = row.sku.toLowerCase();
  let score = 0;

  for (const token of tokens) {
    if (sku.includes(token)) score += 60;
    if (brand === token) score += 50;
    else if (brand.includes(token)) score += 30;
    if (name.startsWith(token)) score += 25;
    else if (name.includes(token)) score += 15;
  }

  if (row.featured) score += 4;
  // Available stock ranks above pieces a shopper cannot buy today.
  if (!row.comingSoon && (row.stock > 0 || row.allowBackorder)) score += 6;

  return score;
}

function toHit(row: HitRow, tokens: string[]): SearchHit {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    sku: row.sku,
    price: row.price,
    currency: row.currency,
    categoryName: row.category.name,
    comingSoon: row.comingSoon,
    inStock: !row.comingSoon && (row.stock > 0 || row.allowBackorder),
    imageUrl: row.images[0]?.url ?? null,
    imageAlt: row.images[0]?.alt ?? row.name,
    score: scoreRow(row, tokens),
  };
}

/** Levenshtein distance, capped — used only to suggest a brand for a typo. */
function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 3) return 99;
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let last = previous[0]!;
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const current = previous[j]!;
      previous[j] = Math.min(
        previous[j]! + 1,
        previous[j - 1]! + 1,
        last + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      last = current;
    }
  }
  return previous[b.length]!;
}

export async function searchProducts(term: string, limit = 24): Promise<SearchHit[]> {
  const tokens = tokenize(term);
  if (tokens.length === 0) return [];

  // Strict pass: every token must match somewhere.
  let rows = await db.product.findMany({
    where: { AND: [PUBLISHED, ...tokens.map(tokenClause)] },
    select: HIT_SELECT,
    take: limit * 2,
  });

  // Loose pass: any token matches. Better a relevant near-miss than nothing.
  if (rows.length === 0 && tokens.length > 1) {
    rows = await db.product.findMany({
      where: { AND: [PUBLISHED, { OR: tokens.map(tokenClause) }] },
      select: HIT_SELECT,
      take: limit * 2,
    });
  }

  return rows
    .map((row) => toHit(row, tokens))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export async function getSearchSuggestions(term: string): Promise<SearchSuggestions> {
  const trimmed = term.trim();
  const tokens = tokenize(trimmed);

  if (tokens.length === 0) {
    return {
      term: trimmed,
      products: [],
      brands: [],
      categories: [],
      collections: [],
      didYouMean: null,
      total: 0,
    };
  }

  const [products, brandRows, categories, collections] = await Promise.all([
    searchProducts(trimmed, 6),
    db.product.groupBy({
      by: ["brand"],
      where: PUBLISHED,
      _count: { _all: true },
    }),
    db.category.findMany({
      where: { status: { in: ["ACTIVE", "COMING_SOON"] } },
      select: { name: true, slug: true },
    }),
    db.collection.findMany({ where: { status: "ACTIVE" }, select: { name: true, slug: true } }),
  ]);

  const matches = (value: string) =>
    tokens.some((token) => value.toLowerCase().includes(token));

  const brands = brandRows
    .filter((row) => matches(row.brand))
    .map((row) => ({ name: row.brand, count: row._count._all }));

  // Nothing matched — offer the closest brand name as a correction.
  let didYouMean: string | null = null;
  if (products.length === 0) {
    const candidate = brandRows
      .map((row) => ({
        name: row.brand,
        distance: Math.min(...tokens.map((token) => editDistance(token, row.brand.toLowerCase()))),
      }))
      .sort((a, b) => a.distance - b.distance)[0];
    if (candidate && candidate.distance <= 3) didYouMean = candidate.name;
  }

  return {
    term: trimmed,
    products,
    brands,
    categories: categories.filter((category) => matches(category.name)),
    collections: collections.filter((collection) => matches(collection.name)),
    didYouMean,
    total: products.length,
  };
}

/** Records the query so popular searches can be surfaced later. */
export async function logSearch(term: string, results: number) {
  const trimmed = term.trim().slice(0, 120);
  if (trimmed.length < 2) return;
  try {
    await db.searchQuery.create({ data: { term: trimmed.toLowerCase(), results } });
  } catch {
    // Logging must never break a search.
  }
}

export async function popularSearches(limit = 6) {
  const rows = await db.searchQuery.groupBy({
    by: ["term"],
    where: { results: { gt: 0 } },
    _count: { _all: true },
    orderBy: { _count: { term: "desc" } },
    take: limit,
  });
  return rows.map((row) => row.term);
}
