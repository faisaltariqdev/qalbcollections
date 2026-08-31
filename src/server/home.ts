import { cache } from "react";

import { db } from "@/lib/db";
import { TRUST_POINTS } from "@/server/trust";

import { listCollections, listCurated, listTags } from "./catalog";

/** Everything the homepage needs, in one place, ordered by the CMS. */

export const getHomeSections = cache(async () => {
  return db.homeSection.findMany({
    where: { enabled: true },
    orderBy: { sortOrder: "asc" },
  });
});

export const getHomeHero = cache(async () => {
  return db.banner.findFirst({
    where: { placement: "home_hero", active: true },
    orderBy: { sortOrder: "asc" },
  });
});

export const getFeaturedJournalPosts = cache(async (limit = 3) => {
  return db.blogPost.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    take: limit,
  });
});

export async function getHomeData() {
  const [
    sections,
    hero,
    featured,
    newArrivals,
    bestsellers,
    collections,
    posts,
    styleTags,
    occasionTags,
    audienceTags,
  ] = await Promise.all([
    getHomeSections(),
    getHomeHero(),
    listCurated("featured", 4),
    listCurated("newArrival", 4),
    listCurated("bestseller", 4),
    listCollections(true),
    getFeaturedJournalPosts(3),
    listTags("style"),
    listTags("occasion"),
    listTags("audience"),
  ]);

  return {
    sections,
    hero,
    featured,
    newArrivals,
    bestsellers,
    collections: collections.map((collection) => ({
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      imageUrl: collection.imageUrl,
      count: collection._count.products,
    })),
    posts,
    trustPoints: TRUST_POINTS,
    styleTags: styleTags.map((tag) => ({ slug: tag.slug, label: tag.label })),
    occasionTags: occasionTags.map((tag) => ({ slug: tag.slug, label: tag.label })),
    audienceTags: audienceTags.map((tag) => ({ slug: tag.slug, label: tag.label })),
  };
}
