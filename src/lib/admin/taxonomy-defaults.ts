import type { TaxonomyFormValues } from "./taxonomy-schema";
import type { CategoryStatus } from "@/lib/constants";

/** A blank editor, and the mapping from a stored row into editor values. */

export const BLANK_TAXONOMY: TaxonomyFormValues = {
  name: "",
  slug: "",
  description: "",
  editorialIntro: "",
  imageUrl: "",
  status: "ACTIVE",
  featured: false,
  sortOrder: "0",
  parentId: "",
  seoTitle: "",
  seoDescription: "",
  canonicalUrl: "",
  ogImageUrl: "",
  socialTitle: "",
  socialDescription: "",
  noIndex: false,
};

export interface TaxonomyRecord {
  name: string;
  slug: string;
  description: string | null;
  editorialIntro: string | null;
  imageUrl: string | null;
  status: string;
  featured: boolean;
  sortOrder: number;
  parentId?: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  socialTitle: string | null;
  socialDescription: string | null;
  noIndex: boolean;
}

export function toTaxonomyValues(record: TaxonomyRecord): TaxonomyFormValues {
  return {
    name: record.name,
    slug: record.slug,
    description: record.description ?? "",
    editorialIntro: record.editorialIntro ?? "",
    imageUrl: record.imageUrl ?? "",
    status: record.status as CategoryStatus,
    featured: record.featured,
    sortOrder: String(record.sortOrder),
    parentId: record.parentId ?? "",
    seoTitle: record.seoTitle ?? "",
    seoDescription: record.seoDescription ?? "",
    canonicalUrl: record.canonicalUrl ?? "",
    ogImageUrl: record.ogImageUrl ?? "",
    socialTitle: record.socialTitle ?? "",
    socialDescription: record.socialDescription ?? "",
    noIndex: record.noIndex,
  };
}
