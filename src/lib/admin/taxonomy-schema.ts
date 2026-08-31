import { z } from "zod";

import { ATTRIBUTE_TYPES, CATEGORY_STATUSES, type CategoryStatus } from "@/lib/constants";

/**
 * Categories and collections share a shape — a name, a slug, editorial copy, a
 * status and SEO overrides — so they share one schema and one form. The only
 * difference is that a category can declare attributes and sit under a parent.
 */

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slugs need at least two characters")
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens");

const optional = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const taxonomySchema = z.object({
  name: z.string().trim().min(2, "Give this a name").max(120),
  slug,
  description: optional(600),
  editorialIntro: optional(2000),
  imageUrl: optional(500),
  status: z.enum(CATEGORY_STATUSES),
  featured: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  parentId: optional(60),
  seoTitle: optional(70),
  seoDescription: optional(180),
  canonicalUrl: optional(500),
  ogImageUrl: optional(500),
  socialTitle: optional(120),
  socialDescription: optional(200),
  noIndex: z.boolean().default(false),
});

export interface TaxonomyFormValues {
  name: string;
  slug: string;
  description: string;
  editorialIntro: string;
  imageUrl: string;
  status: CategoryStatus;
  featured: boolean;
  sortOrder: string;
  parentId: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  ogImageUrl: string;
  socialTitle: string;
  socialDescription: string;
  noIndex: boolean;
}

export const attributeDefinitionSchema = z.object({
  categoryId: z.string().min(1),
  id: z.string().optional(),
  key: z
    .string()
    .trim()
    .min(2)
    .max(48)
    .regex(/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/, "Use lowercase letters, numbers, - or _"),
  label: z.string().trim().min(2).max(64),
  unit: optional(16),
  type: z.enum(ATTRIBUTE_TYPES),
  group: optional(48),
  filterable: z.boolean().default(false),
  comparable: z.boolean().default(false),
  showInSpecs: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
});

export interface TaxonomyActionResult {
  ok: boolean;
  message: string;
  id?: string;
  fieldErrors?: Record<string, string>;
}
