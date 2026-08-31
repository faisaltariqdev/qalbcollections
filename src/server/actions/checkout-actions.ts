"use server";

import { revalidatePath } from "next/cache";

import { getCustomerIdentity } from "@/lib/auth/session";
import { checkoutSchema, type CheckoutFieldErrors, type CheckoutResult } from "@/lib/checkout";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/env";
import { calculateTotals } from "@/lib/money";
import { getPaymentProvider } from "@/lib/payments";
import { limitByClient } from "@/lib/rate-limit";
import { getSiteSettings } from "@/lib/settings";
import { getCart, getOrCreateCart } from "@/server/cart";
import { placeOrder, validateCoupon } from "@/server/orders";

/**
 * Checkout.
 *
 * The submitted form supplies contact and delivery details only. Lines, prices,
 * shipping, discount and total are all read from the server-side cart and
 * recomputed, so a tampered payload cannot buy anything cheaply.
 */
export async function submitCheckout(input: unknown): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors: CheckoutFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !(key in fieldErrors)) {
        fieldErrors[key as keyof CheckoutFieldErrors] = issue.message;
      }
    }
    return { ok: false, message: "Please check the highlighted fields.", fieldErrors };
  }

  const limit = await limitByClient("checkout", 8, 10 * 60_000);
  if (!limit.ok) {
    return { ok: false, message: "Too many attempts. Please wait a moment and try again." };
  }

  const [cart, settings, customer] = await Promise.all([
    getCart(),
    getSiteSettings(),
    getCustomerIdentity(),
  ]);

  if (cart.lines.length === 0) {
    return { ok: false, message: "Your bag is empty." };
  }

  if (!customer && !settings.enableGuestCheckout) {
    return { ok: false, message: "Please sign in to complete your order." };
  }

  const provider = getPaymentProvider(parsed.data.paymentMethod);
  if (!provider || !provider.supports({ currency: cart.currency, amount: cart.totals.total })) {
    return {
      ok: false,
      message: "That payment method is not available for this order.",
      fieldErrors: { paymentMethod: "Choose an available payment method." },
    };
  }

  const result = await placeOrder({
    lines: cart.lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
    customerId: customer?.id ?? null,
    customerName: parsed.data.name,
    customerEmail: parsed.data.email,
    customerPhone: parsed.data.phone,
    shipping: {
      line1: parsed.data.line1,
      line2: parsed.data.line2 || null,
      city: parsed.data.city,
      region: parsed.data.region || null,
      postalCode: parsed.data.postalCode || null,
      country: "PK",
    },
    notes: parsed.data.notes || null,
    couponCode: parsed.data.couponCode || null,
    paymentMethod: provider.id,
    // Provisional; corrected below once the provider has been consulted.
    paymentStatus: "UNPAID",
    currency: cart.currency,
    shippingFlatRate: settings.shippingFlatRate,
    freeShippingThreshold: settings.freeShippingThreshold,
    taxRateBps: settings.taxRateBps,
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  // The provider decides the payment state — cash on delivery defers, a gateway
  // would return a redirect. Checkout itself stays provider-agnostic.
  const initiation = await provider.initiate({
    currency: cart.currency,
    amount: result.total,
    orderNumber: result.orderNumber,
    customerEmail: parsed.data.email,
    returnUrl: absoluteUrl(`/order-success?order=${result.orderNumber}&token=${result.token}`),
  });

  await db.order.update({
    where: { orderNumber: result.orderNumber },
    data: { paymentStatus: initiation.paymentStatus },
  });

  // Empty the bag only once the order exists.
  const cartRow = await getOrCreateCart();
  await db.cartItem.deleteMany({ where: { cartId: cartRow.id } });

  revalidatePath("/cart");
  revalidatePath("/account/orders");

  return { ok: true, orderNumber: result.orderNumber, token: result.token };
}

export interface CouponPreview {
  ok: boolean;
  message: string;
  discountTotal: number;
  total: number;
}

/** Validates a code against the live cart so the summary can show the effect. */
export async function previewCoupon(code: string): Promise<CouponPreview> {
  const cart = await getCart();
  if (cart.lines.length === 0) {
    return { ok: false, message: "Your bag is empty.", discountTotal: 0, total: 0 };
  }

  const validation = await validateCoupon(String(code ?? "").slice(0, 32), cart.totals.subtotal);
  if (!validation.ok || !validation.coupon) {
    return {
      ok: false,
      message: validation.message || "That code is not valid for this order.",
      discountTotal: 0,
      total: cart.totals.total,
    };
  }

  const settings = await getSiteSettings();
  const totals = calculateTotals({
    lines: cart.lines.map((line) => ({ unitPrice: line.unitPrice, quantity: line.quantity })),
    shippingFlat: settings.shippingFlatRate,
    freeShippingThreshold: settings.freeShippingThreshold,
    coupon: validation.coupon,
    taxRateBps: settings.taxRateBps,
  });

  return {
    ok: true,
    message: validation.message,
    discountTotal: totals.discountTotal,
    total: totals.total,
  };
}
