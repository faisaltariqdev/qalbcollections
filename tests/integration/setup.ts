import { afterAll, beforeEach } from "vitest";

import { db } from "@/lib/db";

import { __clearCookies, __setHeader } from "./stubs/next-headers";

/**
 * Every test starts from an empty database and an empty cookie jar, so no test
 * can pass because of a row another one left behind.
 */

// Children first: SQLite enforces the foreign keys this schema declares.
const TABLES = [
  "orderEvent",
  "orderItem",
  "order",
  "cartItem",
  "cart",
  "wishlistItem",
  "wishlist",
  "review",
  "faq",
  "productTag",
  "productCollection",
  "productAttribute",
  "productVariant",
  "productImage",
  "product",
  "attributeDefinition",
  "collection",
  "tag",
  "category",
  "auditLog",
  "session",
  "address",
  "customer",
  "adminUser",
  "coupon",
  "contactMessage",
  "notifyRequest",
  "newsletterSubscriber",
  "searchQuery",
  "mediaAsset",
  "siteSetting",
  "blogPost",
  "page",
  "announcement",
  "navItem",
  "homeSection",
  "banner",
] as const;

let client = 0;

beforeEach(async () => {
  for (const table of TABLES) {
    // deleteMany on every model, addressed by name — one place to keep in step
    // with the schema instead of raw SQL per table.
    await (db[table] as { deleteMany: () => Promise<unknown> }).deleteMany();
  }
  __clearCookies();
  // The rate limiter buckets by client address and lives in process memory, so
  // each test presents a fresh one instead of inheriting its neighbour's count.
  client += 1;
  __setHeader("x-forwarded-for", `10.0.0.${client % 250}`);
});

afterAll(async () => {
  await db.$disconnect();
});
