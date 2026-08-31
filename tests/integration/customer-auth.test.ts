import { describe, expect, it } from "vitest";

import { getCustomerIdentity } from "@/lib/auth/session";
import { COOKIES } from "@/lib/constants";
import { db } from "@/lib/db";
import {
  changePassword,
  registerCustomer,
  signInCustomer,
  updateProfile,
} from "@/server/actions/auth-actions";
import { addToCart } from "@/server/actions/cart-actions";
import { mergeWishlist } from "@/server/actions/wishlist-actions";

import { createCategory, createCustomer, createProduct, PASSWORD } from "./factories";
import { __getCookie } from "./stubs/next-headers";

/**
 * Customer accounts: registration, sign-in, and the two things that must
 * survive signing in — the bag and the guest wishlist.
 */

describe("registerCustomer", () => {
  it("creates an account, hashes the password and signs the customer in", async () => {
    const result = await registerCustomer({
      name: "Ayesha Khan",
      email: "New.Shopper@Example.com",
      phone: "+92 300 1234567",
      password: PASSWORD,
      marketingOptIn: false,
    });

    expect(result.ok).toBe(true);
    const customer = await db.customer.findUniqueOrThrow({
      where: { email: "new.shopper@example.com" },
    });
    expect(customer.passwordHash).not.toContain(PASSWORD);
    expect(__getCookie(COOKIES.customerSession)).toBeTruthy();
    await expect(getCustomerIdentity()).resolves.toMatchObject({ id: customer.id });
  });

  it("rejects a weak password", async () => {
    const result = await registerCustomer({
      name: "Ayesha Khan",
      email: "weak@example.com",
      password: "password",
      marketingOptIn: false,
    });

    expect(result.ok).toBe(false);
    expect(result.fieldErrors?.password).toBeTruthy();
    expect(await db.customer.count()).toBe(0);
  });

  it("refuses a second account on the same email", async () => {
    await createCustomer({ email: "taken@example.com" });

    const result = await registerCustomer({
      name: "Someone Else",
      email: "taken@example.com",
      password: PASSWORD,
      marketingOptIn: false,
    });

    expect(result.ok).toBe(false);
    expect(result.fieldErrors?.email).toBeTruthy();
    expect(await db.customer.count()).toBe(1);
  });

  it("subscribes only when marketing is opted into", async () => {
    await registerCustomer({
      name: "Opted In",
      email: "yes@example.com",
      password: PASSWORD,
      marketingOptIn: true,
    });

    expect(await db.newsletterSubscriber.count()).toBe(1);
  });
});

describe("signInCustomer", () => {
  it("signs a customer in with the right password", async () => {
    const customer = await createCustomer();

    const result = await signInCustomer({ email: customer.email, password: PASSWORD });

    expect(result.ok).toBe(true);
    await expect(getCustomerIdentity()).resolves.toMatchObject({ id: customer.id });
  });

  it("gives an unknown email and a wrong password the same answer", async () => {
    const customer = await createCustomer();

    const wrongPassword = await signInCustomer({ email: customer.email, password: "nope" });
    const unknownEmail = await signInCustomer({ email: "nobody@example.com", password: PASSWORD });

    expect(wrongPassword.ok).toBe(false);
    expect(wrongPassword.message).toBe(unknownEmail.message);
  });

  it("refuses a deactivated account", async () => {
    const customer = await createCustomer({ active: false });

    const result = await signInCustomer({ email: customer.email, password: PASSWORD });

    expect(result.ok).toBe(false);
    await expect(getCustomerIdentity()).resolves.toBeNull();
  });

  it("carries the guest bag into the account", async () => {
    const category = await createCategory();
    const product = await createProduct(category.id, { stock: 3 });
    await addToCart({ productId: product.id, quantity: 1 });

    const customer = await createCustomer();
    await signInCustomer({ email: customer.email, password: PASSWORD });

    const cart = await db.cart.findFirstOrThrow({ include: { items: true } });
    expect(cart.customerId).toBe(customer.id);
    expect(cart.items).toHaveLength(1);
  });
});

describe("changePassword", () => {
  it("changes the password and signs other devices out", async () => {
    const customer = await createCustomer();
    await signInCustomer({ email: customer.email, password: PASSWORD });
    // A second device, signed in earlier.
    await db.session.create({
      data: {
        tokenHash: "a".repeat(64),
        customerId: customer.id,
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    });

    const result = await changePassword({
      currentPassword: PASSWORD,
      newPassword: "Qalb!Newer5678",
    });

    expect(result.ok).toBe(true);
    const sessions = await db.session.findMany({ where: { customerId: customer.id } });
    expect(sessions).toHaveLength(1);
    expect(sessions[0].tokenHash).not.toBe("a".repeat(64));

    await expect(
      signInCustomer({ email: customer.email, password: "Qalb!Newer5678" }),
    ).resolves.toMatchObject({ ok: true });
  });

  it("refuses without the current password", async () => {
    const customer = await createCustomer();
    await signInCustomer({ email: customer.email, password: PASSWORD });

    const result = await changePassword({
      currentPassword: "not-it",
      newPassword: "Qalb!Newer5678",
    });

    expect(result.ok).toBe(false);
    expect(result.fieldErrors?.currentPassword).toBeTruthy();
  });

  it("refuses a signed-out caller", async () => {
    await expect(
      changePassword({ currentPassword: PASSWORD, newPassword: "Qalb!Newer5678" }),
    ).rejects.toThrow();
  });
});

describe("updateProfile", () => {
  it("saves the customer's own details and nobody else's", async () => {
    const customer = await createCustomer();
    const other = await createCustomer({ email: "other@example.com" });
    await signInCustomer({ email: customer.email, password: PASSWORD });

    const result = await updateProfile({
      name: "Ayesha K. Khan",
      phone: "+92 321 7654321",
      marketingOptIn: true,
    });

    expect(result.ok).toBe(true);
    await expect(db.customer.findUniqueOrThrow({ where: { id: customer.id } })).resolves.toMatchObject({
      name: "Ayesha K. Khan",
      marketingOptIn: true,
    });
    await expect(db.customer.findUniqueOrThrow({ where: { id: other.id } })).resolves.toMatchObject({
      name: "Ayesha Khan",
      marketingOptIn: false,
    });
  });
});

describe("mergeWishlist", () => {
  it("keeps the guest list and the saved list, without duplicates", async () => {
    const category = await createCategory();
    const saved = await createProduct(category.id, { slug: "already-saved", sku: "QC-A" });
    const guest = await createProduct(category.id, { slug: "saved-as-guest", sku: "QC-B" });

    const customer = await createCustomer();
    await signInCustomer({ email: customer.email, password: PASSWORD });

    const wishlist = await db.wishlist.create({
      data: { customerId: customer.id, token: `customer-${customer.id}` },
    });
    await db.wishlistItem.create({ data: { wishlistId: wishlist.id, productId: saved.id } });

    const result = await mergeWishlist({ productIds: [guest.id, saved.id] });

    expect(result.productIds).toHaveLength(2);
    expect(new Set(result.productIds)).toEqual(new Set([saved.id, guest.id]));
    expect(await db.wishlistItem.count()).toBe(2);
  });

  it("ignores ids that are not real products", async () => {
    const customer = await createCustomer();
    await signInCustomer({ email: customer.email, password: PASSWORD });

    const result = await mergeWishlist({ productIds: ["not-a-product"] });

    expect(result.productIds).toEqual([]);
  });

  it("leaves a signed-out visitor's list in their own browser", async () => {
    const result = await mergeWishlist({ productIds: ["anything"] });

    expect(result.productIds).toEqual(["anything"]);
    expect(await db.wishlist.count()).toBe(0);
  });
});
