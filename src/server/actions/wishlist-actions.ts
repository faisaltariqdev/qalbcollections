"use server";

import { randomBytes } from "node:crypto";

import { z } from "zod";

import { getCustomerIdentity } from "@/lib/auth/session";
import { db } from "@/lib/db";

const schema = z.object({
  productId: z.string().min(1),
  action: z.enum(["add", "remove"]),
});

/**
 * Mirrors a wishlist change for signed-in customers.
 *
 * Signed-out visitors are a deliberate no-op: their wishlist lives in their own
 * browser, so there is nothing to persist and no anonymous row to create.
 */
export async function syncWishlist(input: z.input<typeof schema>) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const customer = await getCustomerIdentity();
  if (!customer) return { ok: true, synced: false };

  const product = await db.product.findUnique({
    where: { id: parsed.data.productId },
    select: { id: true },
  });
  if (!product) return { ok: false };

  const wishlist =
    (await db.wishlist.findFirst({ where: { customerId: customer.id } })) ??
    (await db.wishlist.create({
      data: { customerId: customer.id, token: randomBytes(18).toString("base64url") },
    }));

  if (parsed.data.action === "add") {
    await db.wishlistItem.upsert({
      where: { wishlistId_productId: { wishlistId: wishlist.id, productId: product.id } },
      update: {},
      create: { wishlistId: wishlist.id, productId: product.id },
    });
  } else {
    await db.wishlistItem.deleteMany({
      where: { wishlistId: wishlist.id, productId: product.id },
    });
  }

  return { ok: true, synced: true };
}

const mergeSchema = z.object({ productIds: z.array(z.string().min(1)).max(200) });

/**
 * Merges a guest wishlist into the account on sign-in and returns the combined
 * list, so nothing saved before signing in is lost.
 */
export async function mergeWishlist(input: z.input<typeof mergeSchema>) {
  const parsed = mergeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, productIds: [] as string[] };

  const customer = await getCustomerIdentity();
  if (!customer) return { ok: true, productIds: parsed.data.productIds };

  const known = await db.product.findMany({
    where: { id: { in: parsed.data.productIds }, status: "ACTIVE" },
    select: { id: true },
  });

  const wishlist =
    (await db.wishlist.findFirst({ where: { customerId: customer.id } })) ??
    (await db.wishlist.create({
      data: { customerId: customer.id, token: randomBytes(18).toString("base64url") },
    }));

  for (const product of known) {
    await db.wishlistItem.upsert({
      where: { wishlistId_productId: { wishlistId: wishlist.id, productId: product.id } },
      update: {},
      create: { wishlistId: wishlist.id, productId: product.id },
    });
  }

  const merged = await db.wishlistItem.findMany({
    where: { wishlistId: wishlist.id },
    orderBy: { createdAt: "desc" },
    select: { productId: true },
  });

  return { ok: true, productIds: merged.map((item) => item.productId) };
}

/** Server-side wishlist for the account area, where the list must be durable. */
export async function getSavedWishlistIds() {
  const customer = await getCustomerIdentity();
  if (!customer) return [];

  const wishlist = await db.wishlist.findFirst({
    where: { customerId: customer.id },
    include: { items: { orderBy: { createdAt: "desc" }, select: { productId: true } } },
  });

  return wishlist?.items.map((item) => item.productId) ?? [];
}
