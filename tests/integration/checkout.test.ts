import { beforeEach, describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { addToCart, updateCartItem } from "@/server/actions/cart-actions";
import { previewCoupon, submitCheckout } from "@/server/actions/checkout-actions";
import { getCart } from "@/server/cart";

import { createCategory, createProduct } from "./factories";

/**
 * Checkout, end to end: the cart, stock, coupons and the order that comes out.
 * The submitted form carries contact details only — every figure is recomputed
 * server-side, and these tests hold that line.
 */

let categoryId: string;

const DETAILS = {
  name: "Ayesha Khan",
  email: "shopper@qalb.test",
  phone: "+92 300 1234567",
  line1: "12 Zamzama Boulevard",
  line2: "",
  city: "Karachi",
  region: "Sindh",
  postalCode: "75500",
  notes: "",
  couponCode: "",
  paymentMethod: "cod",
  acceptTerms: true as const,
};

beforeEach(async () => {
  categoryId = (await createCategory()).id;
  await db.siteSetting.createMany({
    data: [
      { key: "shippingFlatRate", value: "50000", group: "commerce" },
      { key: "freeShippingThreshold", value: "5000000", group: "commerce" },
      { key: "taxRateBps", value: "0", group: "commerce" },
    ],
  });
});

describe("adding to the bag", () => {
  it("adds a published piece and prices it from the product row", async () => {
    const product = await createProduct(categoryId, { price: 2_450_000, stock: 3 });

    const result = await addToCart({ productId: product.id, quantity: 1 });

    expect(result.ok).toBe(true);
    const cart = await getCart();
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0].unitPrice).toBe(2_450_000);
    expect(cart.totals.subtotal).toBe(2_450_000);
  });

  it("merges a repeat add into the existing line", async () => {
    const product = await createProduct(categoryId, { stock: 5 });
    await addToCart({ productId: product.id, quantity: 1 });
    await addToCart({ productId: product.id, quantity: 2 });

    const cart = await getCart();
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0].quantity).toBe(3);
  });

  it("refuses more than the shelf holds", async () => {
    const product = await createProduct(categoryId, { stock: 2 });

    const result = await addToCart({ productId: product.id, quantity: 3 });

    expect(result.ok).toBe(false);
    expect(result.message).toContain("Only 2");
  });

  it("refuses a draft, a coming-soon piece and a hidden category", async () => {
    const draft = await createProduct(categoryId, { slug: "draft", status: "DRAFT" });
    const unreleased = await createProduct(categoryId, { slug: "soon", comingSoon: true });
    const hidden = await createCategory({ slug: "hidden", name: "Hidden" });
    await db.category.update({ where: { id: hidden.id }, data: { status: "HIDDEN" } });
    const buried = await createProduct(hidden.id, { slug: "buried" });

    expect((await addToCart({ productId: draft.id, quantity: 1 })).ok).toBe(false);
    expect((await addToCart({ productId: unreleased.id, quantity: 1 })).ok).toBe(false);
    expect((await addToCart({ productId: buried.id, quantity: 1 })).ok).toBe(false);
    expect((await getCart()).lines).toHaveLength(0);
  });

  it("clamps a line to live stock when the shelf empties after the add", async () => {
    const product = await createProduct(categoryId, { stock: 4 });
    await addToCart({ productId: product.id, quantity: 3 });

    await db.product.update({ where: { id: product.id }, data: { stock: 1 } });

    const cart = await getCart();
    expect(cart.lines[0].quantity).toBe(1);
  });

  it("drops a line entirely once the piece is unpublished", async () => {
    const product = await createProduct(categoryId, { stock: 2 });
    await addToCart({ productId: product.id, quantity: 1 });

    await db.product.update({ where: { id: product.id }, data: { status: "ARCHIVED" } });

    expect((await getCart()).lines).toHaveLength(0);
  });

  it("will not let one shopper edit another's bag line", async () => {
    const product = await createProduct(categoryId, { stock: 3 });
    await addToCart({ productId: product.id, quantity: 1 });
    const mine = await getCart();

    // A line id belonging to a different cart, as a tampered request would send.
    const otherCart = await db.cart.create({ data: { token: "someone-else" } });
    const theirs = await db.cartItem.create({
      data: { cartId: otherCart.id, productId: product.id, quantity: 1 },
    });

    const result = await updateCartItem({ itemId: theirs.id, quantity: 5 });

    expect(result.ok).toBe(false);
    expect(await db.cartItem.findUniqueOrThrow({ where: { id: theirs.id } })).toMatchObject({
      quantity: 1,
    });
    expect(mine.lines).toHaveLength(1);
  });
});

describe("submitCheckout", () => {
  it("places an order, decrements stock and empties the bag", async () => {
    const product = await createProduct(categoryId, { price: 2_450_000, stock: 3 });
    await addToCart({ productId: product.id, quantity: 2 });

    const result = await submitCheckout(DETAILS);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const order = await db.order.findUniqueOrThrow({
      where: { orderNumber: result.orderNumber },
      include: { items: true, events: true },
    });
    expect(order.subtotal).toBe(4_900_000);
    expect(order.shippingTotal).toBe(50_000);
    expect(order.total).toBe(4_950_000);
    expect(order.status).toBe("PENDING");
    expect(order.items).toHaveLength(1);
    expect(order.items[0].quantity).toBe(2);
    expect(order.events).toHaveLength(1);

    const restocked = await db.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(restocked.stock).toBe(1);
    expect((await getCart()).lines).toHaveLength(0);
  });

  it("charges flat shipping below the free-shipping threshold", async () => {
    const product = await createProduct(categoryId, { price: 100_000, stock: 5 });
    await addToCart({ productId: product.id, quantity: 1 });

    const result = await submitCheckout(DETAILS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const order = await db.order.findUniqueOrThrow({ where: { orderNumber: result.orderNumber } });
    expect(order.shippingTotal).toBe(50_000);
    expect(order.total).toBe(150_000);
  });

  it("waives shipping once the order passes the free-shipping threshold", async () => {
    const product = await createProduct(categoryId, { price: 6_000_000, stock: 2 });
    await addToCart({ productId: product.id, quantity: 1 });

    const result = await submitCheckout(DETAILS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const order = await db.order.findUniqueOrThrow({ where: { orderNumber: result.orderNumber } });
    expect(order.shippingTotal).toBe(0);
    expect(order.total).toBe(6_000_000);
  });

  it("issues an opaque token instead of a guessable order URL", async () => {
    const product = await createProduct(categoryId, { stock: 2 });
    await addToCart({ productId: product.id, quantity: 1 });

    const result = await submitCheckout(DETAILS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.token.length).toBeGreaterThan(20);
    const order = await db.order.findUniqueOrThrow({ where: { orderNumber: result.orderNumber } });
    expect(order.accessToken).toBe(result.token);
    expect(order.orderNumber).toMatch(/^QC-\d{4}-\d{6}$/);
  });

  it("refuses an empty bag", async () => {
    const result = await submitCheckout(DETAILS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toBe("Your bag is empty.");
  });

  it("returns field errors for an incomplete address without touching stock", async () => {
    const product = await createProduct(categoryId, { stock: 2 });
    await addToCart({ productId: product.id, quantity: 1 });

    const result = await submitCheckout({ ...DETAILS, line1: "", acceptTerms: false });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors?.line1).toBeTruthy();
    expect(result.fieldErrors?.acceptTerms).toBeTruthy();
    expect(await db.order.count()).toBe(0);
    expect((await db.product.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(2);
  });

  it("refuses a payment method that is not switched on", async () => {
    const product = await createProduct(categoryId, { stock: 2 });
    await addToCart({ productId: product.id, quantity: 1 });

    const result = await submitCheckout({ ...DETAILS, paymentMethod: "stripe" });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors?.paymentMethod).toBeTruthy();
    expect(await db.order.count()).toBe(0);
  });

  it("lets the provider decide the payment state", async () => {
    const product = await createProduct(categoryId, { stock: 2 });
    await addToCart({ productId: product.id, quantity: 1 });

    const result = await submitCheckout(DETAILS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const order = await db.order.findUniqueOrThrow({ where: { orderNumber: result.orderNumber } });
    expect(order.paymentMethod).toBe("cod");
    expect(order.paymentStatus).toBe("UNPAID");
  });

  it("does not oversell when the shelf empties between adding and paying", async () => {
    const product = await createProduct(categoryId, { stock: 2 });
    await addToCart({ productId: product.id, quantity: 2 });

    await db.product.update({ where: { id: product.id }, data: { stock: 0 } });

    const result = await submitCheckout(DETAILS);

    expect(result.ok).toBe(false);
    expect(await db.order.count()).toBe(0);
  });

  it("ignores a total sent by the client", async () => {
    const product = await createProduct(categoryId, { price: 2_450_000, stock: 2 });
    await addToCart({ productId: product.id, quantity: 1 });

    const result = await submitCheckout({ ...DETAILS, total: 1, subtotal: 1 });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const order = await db.order.findUniqueOrThrow({ where: { orderNumber: result.orderNumber } });
    expect(order.subtotal).toBe(2_450_000);
    expect(order.total).toBe(2_500_000);
  });
});

describe("coupons", () => {
  beforeEach(async () => {
    await db.coupon.create({
      data: {
        code: "QALB10",
        type: "PERCENT",
        value: 10,
        description: "Code applied.",
        active: true,
      },
    });
  });

  it("previews the discount against the live bag", async () => {
    const product = await createProduct(categoryId, { price: 1_000_000, stock: 3 });
    await addToCart({ productId: product.id, quantity: 1 });

    const preview = await previewCoupon("qalb10");

    expect(preview.ok).toBe(true);
    expect(preview.discountTotal).toBe(100_000);
    expect(preview.total).toBe(950_000); // 1,000,000 − 100,000 + 50,000 shipping
  });

  it("applies the discount to the order and counts the redemption", async () => {
    const product = await createProduct(categoryId, { price: 1_000_000, stock: 3 });
    await addToCart({ productId: product.id, quantity: 1 });

    const result = await submitCheckout({ ...DETAILS, couponCode: "QALB10" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const order = await db.order.findUniqueOrThrow({ where: { orderNumber: result.orderNumber } });
    expect(order.discountTotal).toBe(100_000);
    expect(order.couponCode).toBe("QALB10");

    const coupon = await db.coupon.findUniqueOrThrow({ where: { code: "QALB10" } });
    expect(coupon.redemptions).toBe(1);
  });

  it("gives one answer to every invalid code, so it cannot be probed", async () => {
    const product = await createProduct(categoryId, { stock: 2 });
    await addToCart({ productId: product.id, quantity: 1 });
    await db.coupon.create({
      data: { code: "EXPIRED", type: "PERCENT", value: 20, endsAt: new Date("2020-01-01") },
    });

    const unknown = await previewCoupon("NOSUCHCODE");
    const expired = await previewCoupon("EXPIRED");

    expect(unknown.ok).toBe(false);
    expect(expired.ok).toBe(false);
    expect(expired.message).toBe(unknown.message);
  });

  it("ignores a code below its minimum spend", async () => {
    const product = await createProduct(categoryId, { price: 100_000, stock: 2 });
    await addToCart({ productId: product.id, quantity: 1 });
    await db.coupon.create({
      data: { code: "BIGSPEND", type: "FIXED", value: 50_000, minSubtotal: 1_000_000 },
    });

    const preview = await previewCoupon("BIGSPEND");
    expect(preview.ok).toBe(false);
  });

  it("stops honouring a code once its redemption cap is reached", async () => {
    const product = await createProduct(categoryId, { stock: 2 });
    await addToCart({ productId: product.id, quantity: 1 });
    await db.coupon.update({
      where: { code: "QALB10" },
      data: { maxRedemptions: 1, redemptions: 1 },
    });

    expect((await previewCoupon("QALB10")).ok).toBe(false);
  });
});
