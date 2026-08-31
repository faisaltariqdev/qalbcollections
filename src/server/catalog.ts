import type { Prisma } from "@prisma/client";
import { cache } from "react";

import { PRODUCTS_PER_PAGE, type CategoryStatus } from "@/lib/constants";
import { db } from "@/lib/db";
import {
  type CategorySummary,
  type ComparisonProduct,
  type Facet,
  type FacetOption,
  type ProductBadge,
  type ProductCardData,
  type ProductDetailData,
  type ProductQuery,
  type SpecificationRow,
} from "./catalog-types";

/**
 * Catalogue read model.
 *
 * Filtering, sorting and pagination happen in SQL. Facet counts are derived
 * from one extra projection query over the same candidate set, which keeps
 * counts exact without an N+1 per facet.
 */

const CARD_SELECT = {
  id: true,
  name: true,
  slug: true,
  brand: true,
  sku: true,
  shortDescription: true,
  price: true,
  compareAtPrice: true,
  currency: true,
  stock: true,
  lowStockThreshold: true,
  allowBackorder: true,
  comingSoon: true,
  newArrival: true,
  bestseller: true,
  limited: true,
  exclusive: true,
  category: { select: { name: true, slug: true } },
  images: {
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
    select: { url: true, alt: true, width: true, height: true },
  },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof CARD_SELECT }>;

function isInStock(row: { stock: number; allowBackorder: boolean; comingSoon: boolean }) {
  if (row.comingSoon) return false;
  return row.stock > 0 || row.allowBackorder;
}

/**
 * Badges are derived, never stored as free text, so the vocabulary stays small.
 * At most two are shown on a card — restraint is the point.
 */
function deriveBadges(row: {
  comingSoon: boolean;
  newArrival: boolean;
  bestseller: boolean;
  limited: boolean;
  exclusive: boolean;
  stock: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
}): ProductBadge[] {
  const badges: ProductBadge[] = [];

  if (row.comingSoon) badges.push({ label: "Coming soon", tone: "gilt" });
  if (row.exclusive) badges.push({ label: "Exclusive", tone: "qalb" });
  if (row.limited) badges.push({ label: "Limited", tone: "ink" });
  if (row.newArrival && !row.comingSoon) badges.push({ label: "New", tone: "ink" });
  if (row.bestseller && !row.comingSoon) badges.push({ label: "Bestseller", tone: "neutral" });
  if (
    !row.comingSoon &&
    !row.allowBackorder &&
    row.stock > 0 &&
    row.stock <= row.lowStockThreshold
  ) {
    badges.push({ label: "Low stock", tone: "warning" });
  }

  return badges.slice(0, 2);
}

/**
 * Lookbook posters that must ship as a primary/hover pair even if the
 * database still has a single image row from an earlier seed.
 */
const LOOKBOOK_IMAGE_OVERRIDES: Record<
  string,
  { primary: { url: string; alt: string; width: number; height: number }; secondary: { url: string; alt: string; width: number; height: number } }
> = {
  "citizen-quartz-day-date-two-tone-silver": {
    primary: {
      url: "/media/lookbook/citizen-square-hero.jpg",
      alt: "Citizen square two-tone automatic with a silver dial on a cream marble pedestal",
      width: 576,
      height: 1024,
    },
    secondary: {
      url: "/media/lookbook/citizen-square-detail.jpg",
      alt: "Citizen square two-tone — premium details, case-back, profile and presentation box",
      width: 602,
      height: 1024,
    },
  },
};

function resolveImages(slug: string, images: CardRow["images"]) {
  const override = LOOKBOOK_IMAGE_OVERRIDES[slug];
  if (override) {
    return {
      primaryImage: override.primary,
      secondaryImage: override.secondary,
      gallery: [override.primary, override.secondary],
    };
  }
  return {
    primaryImage: images[0] ?? null,
    secondaryImage: images[1] ?? null,
    gallery: images,
  };
}

function toCard(row: CardRow): ProductCardData {
  const images = resolveImages(row.slug, row.images);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    sku: row.sku,
    shortDescription: row.shortDescription,
    price: row.price,
    compareAtPrice: row.compareAtPrice,
    currency: row.currency,
    primaryImage: images.primaryImage,
    secondaryImage: images.secondaryImage,
    category: row.category,
    inStock: isInStock(row),
    lowStock:
      !row.comingSoon && !row.allowBackorder && row.stock > 0 && row.stock <= row.lowStockThreshold,
    comingSoon: row.comingSoon,
    badges: deriveBadges(row),
  };
}

/** Only ACTIVE products in a visible category are ever published. */
function publishedWhere(includeComingSoon = true): Prisma.ProductWhereInput {
  return {
    status: "ACTIVE",
    category: { status: { in: ["ACTIVE", "COMING_SOON"] } },
    ...(includeComingSoon ? {} : { comingSoon: false }),
  };
}

function buildWhere(query: ProductQuery): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [publishedWhere(query.includeComingSoon ?? true)];

  if (query.categorySlug) {
    and.push({
      OR: [
        { category: { slug: query.categorySlug } },
        { category: { parent: { slug: query.categorySlug } } },
      ],
    });
  }
  if (query.collectionSlug) {
    and.push({ collections: { some: { collection: { slug: query.collectionSlug } } } });
  }
  if (query.tagSlugs?.length) {
    and.push({ tags: { some: { tag: { slug: { in: query.tagSlugs } } } } });
  }
  if (query.brands?.length) {
    and.push({ brand: { in: query.brands } });
  }
  if (query.priceMin !== undefined) {
    and.push({ price: { gte: query.priceMin } });
  }
  if (query.priceMax !== undefined) {
    and.push({ price: { lte: query.priceMax } });
  }
  if (query.inStockOnly) {
    and.push({ comingSoon: false, OR: [{ stock: { gt: 0 } }, { allowBackorder: true }] });
  }
  if (query.flags?.featured) and.push({ featured: true });
  if (query.flags?.newArrival) and.push({ newArrival: true });
  if (query.flags?.bestseller) and.push({ bestseller: true });
  if (query.search?.trim()) {
    const term = query.search.trim();
    and.push({
      OR: [
        { name: { contains: term } },
        { brand: { contains: term } },
        { sku: { contains: term } },
        { shortDescription: { contains: term } },
        { description: { contains: term } },
        { category: { name: { contains: term } } },
        { attributes: { some: { value: { contains: term } } } },
      ],
    });
  }

  // Values within one attribute are OR'd; separate attributes are AND'd, which
  // is the behaviour shoppers expect from faceted navigation.
  for (const [key, values] of Object.entries(query.attributes ?? {})) {
    if (values.length === 0) continue;
    and.push({ attributes: { some: { definition: { key }, value: { in: values } } } });
  }

  return { AND: and };
}

function buildOrderBy(sort: ProductQuery["sort"]): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price-asc":
      return [{ price: "asc" }, { name: "asc" }];
    case "price-desc":
      return [{ price: "desc" }, { name: "asc" }];
    case "newest":
      return [{ publishedAt: "desc" }, { createdAt: "desc" }];
    case "name-asc":
      return [{ name: "asc" }];
    default:
      // Curated: coming-soon last, then editor order, then newest.
      return [
        { comingSoon: "asc" },
        { featured: "desc" },
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ];
  }
}

export interface ProductListResult {
  products: ProductCardData[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

export async function listProducts(query: ProductQuery = {}): Promise<ProductListResult> {
  const perPage = query.perPage ?? PRODUCTS_PER_PAGE;
  const where = buildWhere(query);

  const total = await db.product.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(query.page ?? 1, 1), pageCount);

  const rows = await db.product.findMany({
    where,
    select: CARD_SELECT,
    orderBy: buildOrderBy(query.sort),
    skip: (page - 1) * perPage,
    take: perPage,
  });

  return { products: rows.map(toCard), total, page, perPage, pageCount };
}

/** Convenience reader for curated homepage rails. */
export async function listCurated(
  kind: "featured" | "newArrival" | "bestseller",
  limit = 4,
  categorySlug?: string,
): Promise<ProductCardData[]> {
  const rows = await db.product.findMany({
    where: {
      ...publishedWhere(false),
      [kind]: true,
      ...(categorySlug ? { category: { slug: categorySlug } } : {}),
    },
    select: CARD_SELECT,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: limit,
  });
  return rows.map(toCard);
}

export async function listProductsByIds(ids: readonly string[]): Promise<ProductCardData[]> {
  if (ids.length === 0) return [];
  const rows = await db.product.findMany({
    where: { id: { in: [...ids] }, ...publishedWhere() },
    select: CARD_SELECT,
  });
  const byId = new Map(rows.map((row) => [row.id, toCard(row)]));
  // Preserve the caller's order (recently viewed, compare tray).
  return ids.map((id) => byId.get(id)).filter((product): product is ProductCardData => Boolean(product));
}

// --- facets ---------------------------------------------------------------

/**
 * Builds the filter rail for a listing.
 *
 * Each facet is counted against the other active filters but not itself, so
 * ticking "Automatic" does not collapse the rest of the Movement list to zero.
 * That requires one query per attribute facet plus one for brand — bounded by
 * the number of declared filterable attributes for the category, not by
 * catalogue size.
 */
export async function getFacets(query: ProductQuery): Promise<Facet[]> {
  const definitions = query.categorySlug
    ? await db.attributeDefinition.findMany({
        where: { filterable: true, category: { slug: query.categorySlug } },
        orderBy: { sortOrder: "asc" },
      })
    : [];

  const facets: Facet[] = [];

  const withoutAttribute = (key: string): ProductQuery => ({
    ...query,
    attributes: Object.fromEntries(
      Object.entries(query.attributes ?? {}).filter(([attrKey]) => attrKey !== key),
    ),
  });

  // Brand
  const brandRows = await db.product.groupBy({
    by: ["brand"],
    where: buildWhere({ ...query, brands: undefined }),
    _count: { _all: true },
    orderBy: { brand: "asc" },
  });

  if (brandRows.length > 1) {
    facets.push({
      param: "brand",
      label: "Brand",
      kind: "checkbox",
      options: brandRows.map((row) => ({
        value: row.brand,
        label: row.brand,
        count: row._count._all,
        selected: query.brands?.includes(row.brand) ?? false,
      })),
    });
  }

  // Price range across the unpriced-filtered set.
  const priceBounds = await db.product.aggregate({
    where: buildWhere({ ...query, priceMin: undefined, priceMax: undefined }),
    _min: { price: true },
    _max: { price: true },
  });

  if (priceBounds._min.price !== null && priceBounds._max.price !== null) {
    if (priceBounds._min.price < priceBounds._max.price) {
      facets.push({
        param: "price",
        label: "Price",
        kind: "range",
        options: [],
        range: {
          min: priceBounds._min.price,
          max: priceBounds._max.price,
          selectedMin: query.priceMin ?? null,
          selectedMax: query.priceMax ?? null,
        },
      });
    }
  }

  // Declared attributes for this category.
  for (const definition of definitions) {
    const rows = await db.productAttribute.groupBy({
      by: ["value"],
      where: {
        definitionId: definition.id,
        product: buildWhere(withoutAttribute(definition.key)),
      },
      _count: { _all: true },
    });

    if (rows.length < 2) continue;

    const selected = query.attributes?.[definition.key] ?? [];
    const options: FacetOption[] = rows
      .map((row) => ({
        value: row.value,
        label: definition.unit ? `${row.value} ${definition.unit}` : row.value,
        count: row._count._all,
        selected: selected.includes(row.value),
      }))
      .sort((a, b) =>
        definition.type === "NUMBER"
          ? Number.parseFloat(a.value) - Number.parseFloat(b.value)
          : a.label.localeCompare(b.label),
      );

    facets.push({
      param: `attr_${definition.key}`,
      label: definition.label,
      kind: "checkbox",
      options,
    });
  }

  // Availability, only where it discriminates.
  const availabilityWhere = buildWhere({ ...query, inStockOnly: false });
  const [available, everything] = await Promise.all([
    db.product.count({
      where: { AND: [availabilityWhere, { comingSoon: false, OR: [{ stock: { gt: 0 } }, { allowBackorder: true }] }] },
    }),
    db.product.count({ where: availabilityWhere }),
  ]);

  if (available > 0 && available < everything) {
    facets.push({
      param: "availability",
      label: "Availability",
      kind: "checkbox",
      options: [
        {
          value: "in-stock",
          label: "Available now",
          count: available,
          selected: query.inStockOnly ?? false,
        },
      ],
    });
  }

  return facets;
}

// --- single product -------------------------------------------------------

export const getProductBySlug = cache(async (slug: string): Promise<ProductDetailData | null> => {
  const row = await db.product.findFirst({
    where: { slug, ...publishedWhere() },
    include: {
      category: { select: { name: true, slug: true } },
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
      variants: { orderBy: { sortOrder: "asc" } },
      attributes: { include: { definition: true } },
      collections: { include: { collection: { select: { name: true, slug: true, status: true } } } },
      tags: { include: { tag: true } },
      faqs: { orderBy: { sortOrder: "asc" } },
      reviews: { where: { approved: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!row) return null;

  const specifications: SpecificationRow[] = row.attributes
    // Only declared, non-empty specifications render — a category never shows
    // an empty "Movement" row just because the field exists.
    .filter((attribute) => attribute.definition.showInSpecs && attribute.value.trim() !== "")
    .sort((a, b) => a.definition.sortOrder - b.definition.sortOrder)
    .map((attribute) => ({
      key: attribute.definition.key,
      label: attribute.definition.label,
      value: attribute.definition.unit
        ? `${attribute.value} ${attribute.definition.unit}`
        : attribute.value,
      unit: attribute.definition.unit,
      group: attribute.definition.group ?? "Specifications",
    }));

  const globalFaqs = await db.faq.findMany({
    where: { productId: null },
    orderBy: { sortOrder: "asc" },
  });

  const card = toCard({ ...row, category: row.category, images: row.images });
  const resolved = resolveImages(row.slug, row.images);

  return {
    ...card,
    description: row.description,
    story: row.story,
    stock: row.stock,
    images: resolved.gallery.map((image) => ({
      url: image.url,
      alt: image.alt,
      width: image.width,
      height: image.height,
    })),
    specifications,
    variants: row.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      value: variant.value,
      sku: variant.sku,
      stock: variant.stock,
    })),
    collections: row.collections
      .filter((entry) => entry.collection.status === "ACTIVE")
      .map((entry) => ({ name: entry.collection.name, slug: entry.collection.slug })),
    tags: row.tags.map((entry) => ({
      slug: entry.tag.slug,
      label: entry.tag.label,
      kind: entry.tag.kind,
    })),
    faqs: [...row.faqs, ...globalFaqs].map((faq) => ({
      question: faq.question,
      answer: faq.answer,
    })),
    reviews: row.reviews.map((review) => ({
      id: review.id,
      authorName: review.authorName,
      rating: review.rating,
      title: review.title,
      body: review.body,
      createdAt: review.createdAt,
    })),
    seo: {
      title: row.seoTitle,
      description: row.seoDescription,
      canonicalUrl: row.canonicalUrl,
      ogImageUrl: row.ogImageUrl,
      socialTitle: row.socialTitle,
      socialDescription: row.socialDescription,
      noIndex: row.noIndex,
    },
    updatedAt: row.updatedAt,
  };
});

/**
 * Comparison read model: cards plus their specification rows, in the order the
 * shopper selected them. Rows are aligned by attribute key in the UI, so pieces
 * from different categories can still be laid side by side.
 */
export async function listComparison(ids: readonly string[]): Promise<ComparisonProduct[]> {
  if (ids.length === 0) return [];

  const rows = await db.product.findMany({
    where: { id: { in: [...ids] }, ...publishedWhere() },
    select: {
      ...CARD_SELECT,
      attributes: { include: { definition: true } },
    },
  });

  const byId = new Map(
    rows.map((row) => [
      row.id,
      {
        ...toCard(row),
        specifications: row.attributes
          .filter((attribute) => attribute.definition.showInSpecs && attribute.value.trim() !== "")
          .sort((a, b) => a.definition.sortOrder - b.definition.sortOrder)
          .map((attribute) => ({
            key: attribute.definition.key,
            label: attribute.definition.label,
            value: attribute.definition.unit
              ? `${attribute.value} ${attribute.definition.unit}`
              : attribute.value,
            unit: attribute.definition.unit,
            group: attribute.definition.group ?? "Specifications",
          })),
      } satisfies ComparisonProduct,
    ]),
  );

  return ids.map((id) => byId.get(id)).filter((product): product is ComparisonProduct => !!product);
}

/**
 * Related products: same category first, then the shared collection, excluding
 * the current piece. Purely deterministic so the page is cacheable.
 */
export async function getRelatedProducts(
  product: Pick<ProductDetailData, "id" | "category" | "collections">,
  limit = 4,
): Promise<ProductCardData[]> {
  const rows = await db.product.findMany({
    where: {
      ...publishedWhere(false),
      id: { not: product.id },
      OR: [
        { category: { slug: product.category.slug } },
        ...(product.collections.length > 0
          ? [
              {
                collections: {
                  some: { collection: { slug: { in: product.collections.map((c) => c.slug) } } },
                },
              },
            ]
          : []),
      ],
    },
    select: CARD_SELECT,
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
    take: limit,
  });
  return rows.map(toCard);
}

/** "Complete the collection" — pieces from the same collection, other categories welcome. */
export async function getCollectionCompanions(
  product: Pick<ProductDetailData, "id" | "collections">,
  limit = 3,
): Promise<ProductCardData[]> {
  if (product.collections.length === 0) return [];
  const rows = await db.product.findMany({
    where: {
      ...publishedWhere(false),
      id: { not: product.id },
      collections: {
        some: { collection: { slug: { in: product.collections.map((c) => c.slug) } } },
      },
    },
    select: CARD_SELECT,
    orderBy: { sortOrder: "asc" },
    take: limit,
  });
  return rows.map(toCard);
}

// --- categories & collections --------------------------------------------

export const getCategoryBySlug = cache(async (slug: string) => {
  const category = await db.category.findUnique({
    where: { slug },
    include: { children: { where: { status: { not: "HIDDEN" } }, orderBy: { sortOrder: "asc" } } },
  });
  if (!category || category.status === "HIDDEN") return null;
  return category;
});

export const listCategories = cache(async (): Promise<CategorySummary[]> => {
  const rows = await db.category.findMany({
    where: { status: { in: ["ACTIVE", "COMING_SOON"] }, parentId: null },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: { where: { status: "ACTIVE", comingSoon: false } } } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    editorialIntro: row.editorialIntro,
    imageUrl: row.imageUrl,
    status: row.status as CategoryStatus,
    productCount: row._count.products,
  }));
});

export const getCollectionBySlug = cache(async (slug: string) => {
  const collection = await db.collection.findUnique({ where: { slug } });
  if (!collection || collection.status === "HIDDEN") return null;
  return collection;
});

export const listCollections = cache(async (featuredOnly = false) => {
  return db.collection.findMany({
    where: { status: "ACTIVE", ...(featuredOnly ? { featured: true } : {}) },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
});

export const listTags = cache(async (kind?: string) => {
  return db.tag.findMany({
    where: kind ? { kind } : undefined,
    orderBy: { sortOrder: "asc" },
  });
});

/** Distinct brands across the published catalogue, for search suggestions. */
export const listBrands = cache(async () => {
  const rows = await db.product.groupBy({
    by: ["brand"],
    where: publishedWhere(),
    _count: { _all: true },
    orderBy: { brand: "asc" },
  });
  return rows.map((row) => ({ name: row.brand, count: row._count._all }));
});
