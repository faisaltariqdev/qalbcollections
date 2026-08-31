import { cache } from "react";

import { db } from "@/lib/db";

/**
 * Editorial and static-page read model.
 *
 * Journal posts and policy pages are rows, not files, so publishing is an admin
 * action. Only ACTIVE records are ever returned to the storefront — the same
 * status vocabulary the admin forms write (see lib/admin/content-schema).
 */

export const getPageBySlug = cache(async (slug: string) =>
  db.page.findFirst({ where: { slug, status: "ACTIVE" } }),
);

export const listPageSlugs = cache(async () =>
  db.page.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
);

const POST_CARD_SELECT = {
  title: true,
  slug: true,
  excerpt: true,
  category: true,
  coverImage: true,
  coverAlt: true,
  readMinutes: true,
  featured: true,
  publishedAt: true,
} as const;

export const listJournalPosts = cache(async (limit?: number) =>
  db.blogPost.findMany({
    where: { status: "ACTIVE" },
    select: POST_CARD_SELECT,
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    ...(limit ? { take: limit } : {}),
  }),
);

export const listJournalCategories = cache(async () => {
  const rows = await db.blogPost.groupBy({
    by: ["category"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
    orderBy: { category: "asc" },
  });
  return rows.map((row) => ({ name: row.category, count: row._count._all }));
});

export const getJournalPost = cache(async (slug: string) =>
  db.blogPost.findFirst({ where: { slug, status: "ACTIVE" } }),
);

/** Further reading: same category first, then anything else recent. */
export async function getRelatedPosts(slug: string, category: string, limit = 3) {
  const sameCategory = await db.blogPost.findMany({
    where: { status: "ACTIVE", slug: { not: slug }, category },
    select: POST_CARD_SELECT,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });

  if (sameCategory.length >= limit) return sameCategory;

  const filler = await db.blogPost.findMany({
    where: {
      status: "ACTIVE",
      slug: { not: slug },
      NOT: { slug: { in: sameCategory.map((post) => post.slug) } },
    },
    select: POST_CARD_SELECT,
    orderBy: { publishedAt: "desc" },
    take: limit - sameCategory.length,
  });

  return [...sameCategory, ...filler];
}
