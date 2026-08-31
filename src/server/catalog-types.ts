import type { CategoryStatus } from "@/lib/constants";

/**
 * Presentation DTOs.
 *
 * Components consume these rather than Prisma models, so the database can be
 * reshaped without touching the UI, and no accidental field (a password hash, a
 * draft note) can be serialised to the client.
 */

export interface ProductImageData {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
}

export interface ProductBadge {
  label: string;
  tone: "ink" | "qalb" | "gilt" | "neutral" | "warning";
}

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  brand: string;
  sku: string;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  primaryImage: ProductImageData | null;
  secondaryImage: ProductImageData | null;
  category: { name: string; slug: string };
  inStock: boolean;
  lowStock: boolean;
  comingSoon: boolean;
  badges: ProductBadge[];
}

export interface SpecificationRow {
  key: string;
  label: string;
  value: string;
  unit: string | null;
  group: string;
}

export interface ProductDetailData extends ProductCardData {
  description: string | null;
  story: string | null;
  stock: number;
  images: ProductImageData[];
  specifications: SpecificationRow[];
  variants: { id: string; name: string; value: string; sku: string; stock: number }[];
  collections: { name: string; slug: string }[];
  tags: { slug: string; label: string; kind: string }[];
  faqs: { question: string; answer: string }[];
  reviews: {
    id: string;
    authorName: string;
    rating: number;
    title: string | null;
    body: string;
    createdAt: Date;
  }[];
  seo: {
    title: string | null;
    description: string | null;
    canonicalUrl: string | null;
    ogImageUrl: string | null;
    socialTitle: string | null;
    socialDescription: string | null;
    noIndex: boolean;
  };
  updatedAt: Date;
}

/** A card plus its specification rows, for the side-by-side comparison table. */
export interface ComparisonProduct extends ProductCardData {
  specifications: SpecificationRow[];
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  editorialIntro: string | null;
  imageUrl: string | null;
  status: CategoryStatus;
  productCount: number;
}

export interface FacetOption {
  value: string;
  label: string;
  count: number;
  selected: boolean;
}

export interface Facet {
  /** Query-string parameter name, e.g. `brand` or `attr_movement`. */
  param: string;
  label: string;
  kind: "checkbox" | "range";
  options: FacetOption[];
  /** Present for `range` facets; minor units for price. */
  range?: { min: number; max: number; selectedMin: number | null; selectedMax: number | null };
}

export const SORT_OPTIONS = [
  { value: "featured", label: "Curated" },
  { value: "newest", label: "New in" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name-asc", label: "Alphabetical" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export function isSortValue(value: string | undefined): value is SortValue {
  return SORT_OPTIONS.some((option) => option.value === value);
}

export interface ProductQuery {
  categorySlug?: string;
  collectionSlug?: string;
  tagSlugs?: string[];
  brands?: string[];
  /** Minor units. */
  priceMin?: number;
  priceMax?: number;
  inStockOnly?: boolean;
  /** Dynamic attribute filters keyed by attribute key. */
  attributes?: Record<string, string[]>;
  /** Editorial flags, used by the New In and Bestsellers edits. */
  flags?: { featured?: boolean; newArrival?: boolean; bestseller?: boolean };
  search?: string;
  sort?: SortValue;
  page?: number;
  perPage?: number;
  includeComingSoon?: boolean;
}
