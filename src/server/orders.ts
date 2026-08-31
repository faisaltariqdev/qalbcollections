import "server-only";

import { randomBytes, randomInt } from "node:crypto";

import { db } from "@/lib/db";
import { calculateTotals, type CouponInput } from "@/lib/money";

/**
 * Order service.
 *
 * Placing an order is the one place in the storefront that writes money, so it
 * re-reads every price and stock level from the database inside a transaction.
 * The client's totals are never trusted — they are recomputed here and the order
 * is rejected if the basket has changed underneath the shopper.
 */

export interface OrderLineInput {
  productId: string;
  quantity: number;
}

/** Human-readable, non-sequential: reveals nothing about order volume. */
function generateOrderNumber() {
  const year = new Date().getFullYear();
  return `QC-${year}-${randomInt(100_000, 999_999)}`;
}

/** Opaque token so the confirmation page can be shown without a login. */
function generateAccessToken() {
  return randomBytes(18).toString("base64url");
}

export interface CouponValidation {
  ok: boolean;
  message: string;
  coupon: (CouponInput & { code: string }) | null;
}

export async function validateCoupon(rawCode: string, subtotal: number): Promise<CouponValidation> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: true, message: "", coupon: null };

  const coupon = await db.coupon.findUnique({ where: { code } });
  const now = new Date();

  // One message for every failure mode — a discount code is not an oracle.
  const reject = { ok: false, message: "That code is not valid for this order.", coupon: null };

  if (!coupon || !coupon.active) return reject;
  if (coupon.startsAt && coupon.startsAt > now) return reject;
  if (coupon.endsAt && coupon.endsAt < now) return reject;
  if (coupon.maxRedemptions !== null && coupon.redemptions >= coupon.maxRedemptions) return reject;
  if (subtotal < coupon.minSubtotal) return reject;

  return {
    ok: true,
    message: coupon.description ?? "Code applied.",
    coupon: {
      code: coupon.code,
      type: coupon.type === "FIXED" ? "FIXED" : "PERCENT",
      value: coupon.value,
      minSubtotal: coupon.minSubtotal,
    },
  };
}

export interface PlaceOrderInput {
  lines: OrderLineInput[];
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shipping: {
    line1: string;
    line2: string | null;
    city: string;
    region: string | null;
    postalCode: string | null;
    country: string;
  };
  notes: string | null;
  couponCode: string | null;
  paymentMethod: string;
  paymentStatus: string;
  currency: string;
  shippingFlatRate: number;
  freeShippingThreshold: number | null;
  taxRateBps: number;
}

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; token: string; total: number; itemCount: number }
  | { ok: false; message: string };

/**
 * Writes the order, decrements stock and records the opening event in a single
 * transaction. A concurrent purchase that empties the shelf between page load
 * and submit fails here rather than overselling.
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  if (input.lines.length === 0) return { ok: false, message: "Your bag is empty." };

  try {
    return await writeOrder(input);
  } catch (error) {
    // Conditions the shopper can act on are messages, not crashes. Anything else
    // is a genuine fault and belongs in the logs.
    if (error instanceof OrderRejection) return { ok: false, message: error.message };
    throw error;
  }
}

/** Thrown for conditions the shopper can act on; never surfaces internals. */
export class OrderRejection extends Error {}

async function writeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const products = await db.product.findMany({
    where: { id: { in: input.lines.map((line) => line.productId) } },
    select: {
      id: true,
      name: true,
      brand: true,
      sku: true,
      price: true,
      status: true,
      stock: true,
      allowBackorder: true,
      comingSoon: true,
      currency: true,
      images: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }], take: 1 },
    },
  });

  const byId = new Map(products.map((product) => [product.id, product]));

  const items = input.lines.map((line) => {
    const product = byId.get(line.productId);
    if (!product) throw new OrderRejection("A piece in your bag is no longer available.");
    if (product.status !== "ACTIVE" || product.comingSoon) {
      throw new OrderRejection(`${product.name} is no longer available to buy.`);
    }
    if (!product.allowBackorder && product.stock < line.quantity) {
      throw new OrderRejection(
        product.stock === 0
          ? `${product.name} has just sold out.`
          : `Only ${product.stock} of ${product.name} remain.`,
      );
    }

    return {
      productId: product.id,
      name: product.name,
      brand: product.brand,
      sku: product.sku,
      imageUrl: product.images[0]?.url ?? null,
      quantity: line.quantity,
      unitPrice: product.price,
      lineTotal: product.price * line.quantity,
      decrementStock: !product.allowBackorder,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const validation = await validateCoupon(input.couponCode ?? "", subtotal);
  const totals = calculateTotals({
    lines: items.map((item) => ({ unitPrice: item.unitPrice, quantity: item.quantity })),
    shippingFlat: input.shippingFlatRate,
    freeShippingThreshold: input.freeShippingThreshold,
    coupon: validation.coupon,
    taxRateBps: input.taxRateBps,
  });

  const orderNumber = generateOrderNumber();
  const token = generateAccessToken();

  await db.$transaction(async (tx) => {
    for (const item of items) {
      if (!item.decrementStock) continue;
      // Conditional update: the row only changes if the stock is still there,
      // which closes the gap between the check above and the write.
      const updated = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (updated.count === 0) {
        throw new OrderRejection(`${item.name} sold out while you were checking out.`);
      }
    }

    if (validation.coupon) {
      await tx.coupon.update({
        where: { code: validation.coupon.code },
        data: { redemptions: { increment: 1 } },
      });
    }

    await tx.order.create({
      data: {
        orderNumber,
        accessToken: token,
        customerId: input.customerId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        status: "PENDING",
        paymentStatus: input.paymentStatus,
        paymentMethod: input.paymentMethod,
        subtotal: totals.subtotal,
        shippingTotal: totals.shippingTotal,
        discountTotal: totals.discountTotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        currency: input.currency,
        couponCode: validation.coupon?.code ?? null,
        notes: input.notes,
        shippingName: input.customerName,
        shippingLine1: input.shipping.line1,
        shippingLine2: input.shipping.line2,
        shippingCity: input.shipping.city,
        shippingRegion: input.shipping.region,
        shippingPostalCode: input.shipping.postalCode,
        shippingCountry: input.shipping.country,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            brand: item.brand,
            sku: item.sku,
            imageUrl: item.imageUrl,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          })),
        },
        events: {
          create: {
            type: "CREATED",
            message: "Order placed by customer.",
            actor: input.customerEmail,
          },
        },
      },
    });
  });

  return {
    ok: true,
    orderNumber,
    token,
    total: totals.total,
    itemCount: totals.itemCount,
  };
}

/** Confirmation lookup — by token for guests, by owner for signed-in customers. */
export async function getOrderForConfirmation(orderNumber: string, token: string) {
  if (!orderNumber || !token) return null;
  return db.order.findFirst({
    where: { orderNumber, accessToken: token },
    include: { items: true },
  });
}

export async function listCustomerOrders(customerId: string) {
  return db.order.findMany({
    where: { customerId },
    include: { items: { select: { id: true, name: true, brand: true, imageUrl: true, quantity: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCustomerOrder(customerId: string, orderNumber: string) {
  return db.order.findFirst({
    where: { customerId, orderNumber },
    include: { items: true, events: { orderBy: { createdAt: "asc" } } },
  });
}
