import { z } from "zod";

/** Schemas for the editorial side of the admin: journal posts and static pages. */

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slugs need at least two characters")
  .max(140)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens");

const optional = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const CONTENT_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const journalSchema = z.object({
  title: z.string().trim().min(4, "Give the piece a title").max(160),
  slug,
  excerpt: z.string().trim().min(20, "Write a short standfirst").max(320),
  body: z.string().trim().min(120, "A journal entry should say something worth reading"),
  category: z.string().trim().min(2).max(48),
  coverImage: optional(500),
  coverAlt: optional(200),
  authorName: z.string().trim().min(2).max(80),
  readMinutes: z.coerce.number().int().min(1).max(90),
  status: z.enum(CONTENT_STATUSES),
  featured: z.boolean().default(false),
  seoTitle: optional(70),
  seoDescription: optional(180),
  canonicalUrl: optional(500),
  ogImageUrl: optional(500),
  socialTitle: optional(120),
  socialDescription: optional(200),
  noIndex: z.boolean().default(false),
});

export interface JournalFormValues {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  coverImage: string;
  coverAlt: string;
  authorName: string;
  readMinutes: string;
  status: ContentStatus;
  featured: boolean;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  ogImageUrl: string;
  socialTitle: string;
  socialDescription: string;
  noIndex: boolean;
}

export const pageSchema = z.object({
  title: z.string().trim().min(2, "Give the page a title").max(160),
  slug,
  body: z.string().trim().min(40, "A page needs some content"),
  status: z.enum(["ACTIVE", "DRAFT"]),
  seoTitle: optional(70),
  seoDescription: optional(180),
  canonicalUrl: optional(500),
  noIndex: z.boolean().default(false),
});

export interface PageFormValues {
  title: string;
  slug: string;
  body: string;
  status: "ACTIVE" | "DRAFT";
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  noIndex: boolean;
}

export interface ContentActionResult {
  ok: boolean;
  message: string;
  id?: string;
  fieldErrors?: Record<string, string>;
}
