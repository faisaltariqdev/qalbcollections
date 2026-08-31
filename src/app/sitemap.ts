import type { MetadataRoute } from "next";

import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/env";
import { DEDICATED_CATEGORY_ROUTES } from "@/lib/routes";

/**
 * XML sitemap.
 *
 * Only pages worth a search result are listed: live products, live categories
 * and collections, published journal pieces and published static pages. Filter
 * and pagination variants are deliberately absent — they are near-duplicates
 * that would dilute the page they came from.
 */

export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

function entry(
  path: string,
  options: { lastModified?: Date; priority?: number; changeFrequency?: Entry["changeFrequency"] } = {},
): Entry {
  return {
    url: absoluteUrl(path),
    lastModified: options.lastModified ?? new Date(),
    changeFrequency: options.changeFrequency ?? "weekly",
    priority: options.priority ?? 0.5,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories, collections, posts, pages] = await Promise.all([
    db.product.findMany({
      where: { status: "ACTIVE", noIndex: false },
      select: { slug: true, updatedAt: true, featured: true },
    }),
    db.category.findMany({
      where: { status: { in: ["ACTIVE", "COMING_SOON"] }, noIndex: false },
      select: { slug: true, updatedAt: true },
    }),
    db.collection.findMany({
      where: { status: "ACTIVE", noIndex: false },
      select: { slug: true, updatedAt: true },
    }),
    db.blogPost.findMany({
      where: { status: "ACTIVE", noIndex: false },
      select: { slug: true, updatedAt: true, publishedAt: true },
    }),
    db.page.findMany({
      where: { status: "ACTIVE", noIndex: false },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const landing: Entry[] = [
    entry("/", { priority: 1, changeFrequency: "daily" }),
    entry("/shop", { priority: 0.9, changeFrequency: "daily" }),
    entry("/watches", { priority: 0.9, changeFrequency: "daily" }),
    entry("/perfumes", { priority: 0.6, changeFrequency: "monthly" }),
    entry("/collections", { priority: 0.7 }),
    entry("/new-arrivals", { priority: 0.7, changeFrequency: "daily" }),
    entry("/best-sellers", { priority: 0.7, changeFrequency: "daily" }),
    entry("/find-your-timepiece", { priority: 0.6 }),
    entry("/gift-guide", { priority: 0.6 }),
    entry("/journal", { priority: 0.7 }),
    entry("/about", { priority: 0.7, changeFrequency: "monthly" }),
    entry("/contact", { priority: 0.6, changeFrequency: "monthly" }),
  ];

  return [
    ...landing,
    // Categories with a dedicated route are already listed above under that
    // route; `/category/<slug>` only redirects there.
    ...categories
      .filter((category) => !(category.slug in DEDICATED_CATEGORY_ROUTES))
      .map((category) =>
        entry(`/category/${category.slug}`, {
          lastModified: category.updatedAt,
          priority: 0.8,
          changeFrequency: "daily",
        }),
      ),
    ...collections.map((collection) =>
      entry(`/collection/${collection.slug}`, {
        lastModified: collection.updatedAt,
        priority: 0.7,
      }),
    ),
    ...products.map((product) =>
      entry(`/product/${product.slug}`, {
        lastModified: product.updatedAt,
        priority: product.featured ? 0.9 : 0.8,
      }),
    ),
    ...posts.map((post) =>
      entry(`/journal/${post.slug}`, {
        lastModified: post.updatedAt,
        priority: 0.6,
        changeFrequency: "monthly",
      }),
    ),
    ...pages.map((page) =>
      entry(`/${page.slug}`, {
        lastModified: page.updatedAt,
        priority: 0.3,
        changeFrequency: "yearly",
      }),
    ),
  ];
}
