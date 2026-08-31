import { z } from "zod";

import { PRODUCT_STATUSES, type ProductStatus } from "@/lib/constants";

/**
 * Product write contract, shared by the admin form and the Server Action.
 *
 * Money arrives as major units (what the operator types) and is converted to
 * minor units once, here, so no view has to remember the rule.
 */

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug is too short")
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens");

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

/** Empty inputs mean "not set", not zero. */
const optionalAmount = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : Number(value)),
  z.number().positive("Enter a valid amount").max(100_000_000).optional(),
);

export const productImageSchema = z.object({
  url: z.string().trim().min(1, "Image is required").max(500),
  alt: z.string().trim().min(3, "Describe the image for screen readers").max(200),
});

export const productAttributeSchema = z.object({
  definitionId: z.string().min(1),
  value: z.string().trim().max(200),
});

export const productFaqSchema = z.object({
  question: z.string().trim().min(5).max(200),
  answer: z.string().trim().min(5).max(2000),
});

export const productSchema = z
  .object({
    name: z.string().trim().min(2, "Give the piece a name").max(200),
    slug,
    sku: z
      .string()
      .trim()
      .toUpperCase()
      .min(2, "A reference is required")
      .max(60)
      .regex(/^[A-Z0-9][A-Z0-9-]*$/, "Use letters, numbers and hyphens"),
    brand: z.string().trim().min(1, "Brand is required").max(120),
    categoryId: z.string().min(1, "Choose a category"),

    shortDescription: optionalText(300),
    description: optionalText(4000),
    story: optionalText(8000),

    /** Major units, e.g. 42500 for Rs 42,500. */
    price: z.coerce.number().positive("Enter a price").max(100_000_000),
    compareAtPrice: optionalAmount,
    currency: z.string().trim().length(3).default("PKR"),

    stock: z.coerce.number().int().min(0).max(100_000),
    lowStockThreshold: z.coerce.number().int().min(0).max(1000),
    allowBackorder: z.boolean().default(false),

    status: z.enum(PRODUCT_STATUSES),
    featured: z.boolean().default(false),
    newArrival: z.boolean().default(false),
    bestseller: z.boolean().default(false),
    comingSoon: z.boolean().default(false),
    limited: z.boolean().default(false),
    exclusive: z.boolean().default(false),

    seoTitle: optionalText(70),
    seoDescription: optionalText(180),
    canonicalUrl: optionalText(300),
    ogImageUrl: optionalText(300),
    socialTitle: optionalText(90),
    socialDescription: optionalText(200),
    noIndex: z.boolean().default(false),

    images: z.array(productImageSchema).max(12),
    attributes: z.array(productAttributeSchema).max(60),
    collectionIds: z.array(z.string().min(1)).max(20),
    tagIds: z.array(z.string().min(1)).max(30),
    faqs: z.array(productFaqSchema).max(12),
  })
  .refine((data) => data.status !== "ACTIVE" || data.images.length > 0, {
    message: "A published piece needs at least one image",
    path: ["images"],
  })
  .refine(
    (data) => !data.compareAtPrice || data.compareAtPrice > data.price,
    { message: "The compare-at price should be higher than the price", path: ["compareAtPrice"] },
  );

export type ProductParsed = z.output<typeof productSchema>;

/**
 * What the editor holds while typing. Amounts and counts stay strings because
 * that is what an `<input>` produces; the schema above coerces them once, on
 * submit, in one place.
 */
export interface ProductFormValues {
  name: string;
  slug: string;
  sku: string;
  brand: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  story: string;
  price: string;
  compareAtPrice: string;
  currency: string;
  stock: string;
  lowStockThreshold: string;
  allowBackorder: boolean;
  status: ProductStatus;
  featured: boolean;
  newArrival: boolean;
  bestseller: boolean;
  comingSoon: boolean;
  limited: boolean;
  exclusive: boolean;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  ogImageUrl: string;
  socialTitle: string;
  socialDescription: string;
  noIndex: boolean;
  images: { url: string; alt: string }[];
  attributes: { definitionId: string; value: string }[];
  collectionIds: string[];
  tagIds: string[];
  faqs: { question: string; answer: string }[];
}

export interface ProductActionResult {
  ok: boolean;
  message: string;
  id?: string;
  fieldErrors?: Record<string, string>;
}
