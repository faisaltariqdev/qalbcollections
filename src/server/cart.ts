import "server-only";

import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import { cache } from "react";

import { getCustomerIdentity } from "@/lib/auth/session";
import { COOKIES } from "@/lib/constants";
import { db } from "@/lib/db";
import { serverEnv } from "@/lib/env";
import { calculateTotals, type Totals } from "@/lib/money";
import { getSiteSettings } from "@/lib/settings";

/**
 * Server-side cart.
 *
 * Prices are always re-read from the product row, so a cart can never hold a
 * stale price, and quantities are clamped to live stock on every read. The cart
 * is keyed by an httpOnly cookie token and claimed by the customer on sign-in.
 */

export interface CartLine {
  id: string;
  productId: string;
  slug: string;
  name: string;
  brand: string;
  sku: string;
  imageUrl: string | null;
  imageAlt: string;
  variant: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  lineTotal: number;
  /** Stock available right now, for quantity steppers and warnings. */
  available: number;
  currency: string;
}

export interface CartView {
  id: string | null;
  lines: CartLine[];
  totals: Totals;
  currency: string;
  freeShippingThreshold: number | null;
  /** Remaining spend to reach free shipping; null when not applicable. */
  freeShippingRemaining: number | null;
}

const EMPTY_TOTALS: Totals = {
  subtotal: 0,
  discountTotal: 0,
  shippingTotal: 0,
  taxTotal: 0,
  total: 0,
  itemCount: 0,
};

function newCartToken() {
  return randomBytes(24).toString("base64url");
}

async function readCartToken() {
  return (await cookies()).get(COOKIES.cart)?.value ?? null;
}

/**
 * Creates the cart row and cookie. Only callable from a Server Action or Route
 * Handler — Next.js forbids setting cookies while rendering.
 */
export async function getOrCreateCart() {
  const token = await readCartToken();
  const customer = await getCustomerIdentity();

  if (token) {
    const existing = await db.cart.findUnique({ where: { token } });
    if (existing) {
      // Attach an anonymous cart to whoever just signed in.
      if (customer && existing.customerId !== customer.id) {
        return db.cart.update({ where: { id: existing.id }, data: { customerId: customer.id } });
      }
      return existing;
    }
  }

  const newToken = newCartToken();
  const cart = await db.cart.create({
    data: { token: newToken, customerId: customer?.id ?? null },
  });

  (await cookies()).set(COOKIES.cart, newToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: serverEnv().NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });

  return cart;
}

/** Read-only cart lookup, safe to call during rendering. */
export const getCart = cache(async (): Promise<CartView> => {
  const settings = await getSiteSettings();
  const token = await readCartToken();

  const base = {
    currency: settings.currency,
    freeShippingThreshold: settings.freeShippingThreshold,
  };

  if (!token) {
    return { id: null, lines: [], totals: EMPTY_TOTALS, ...base, freeShippingRemaining: null };
  }

  const cart = await db.cart.findUnique({
    where: { token },
    include: {
      items: {
        orderBy: { id: "asc" },
        include: {
          product: {
            include: { images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 } },
          },
        },
      },
    },
  });

  if (!cart) {
    return { id: null, lines: [], totals: EMPTY_TOTALS, ...base, freeShippingRemaining: null };
  }

  const lines: CartLine[] = [];

  for (const item of cart.items) {
    const product = item.product;
    // Anything unpublished or now coming-soon silently drops out of the cart
    // rather than reaching checkout.
    if (product.status !== "ACTIVE" || product.comingSoon) continue;

    const available = product.allowBackorder ? Number.MAX_SAFE_INTEGER : product.stock;
    const quantity = Math.max(0, Math.min(item.quantity, available));
    if (quantity === 0) continue;

    lines.push({
      id: item.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      sku: product.sku,
      imageUrl: product.images[0]?.url ?? null,
      imageAlt: product.images[0]?.alt ?? product.name,
      variant: null,
      unitPrice: product.price,
      compareAtPrice: product.compareAtPrice,
      quantity,
      lineTotal: product.price * quantity,
      available: product.allowBackorder ? 99 : product.stock,
      currency: product.currency,
    });
  }

  const totals = calculateTotals({
    lines: lines.map((line) => ({ unitPrice: line.unitPrice, quantity: line.quantity })),
    shippingFlat: settings.shippingFlatRate,
    freeShippingThreshold: settings.freeShippingThreshold,
    taxRateBps: settings.taxRateBps,
  });

  const freeShippingRemaining =
    settings.freeShippingThreshold !== null && totals.subtotal < settings.freeShippingThreshold
      ? settings.freeShippingThreshold - totals.subtotal
      : null;

  return { id: cart.id, lines, totals, ...base, freeShippingRemaining };
});

export async function getCartSummary() {
  const cart = await getCart();
  return {
    itemCount: cart.totals.itemCount,
    subtotal: cart.totals.subtotal,
    currency: cart.currency,
  };
}
