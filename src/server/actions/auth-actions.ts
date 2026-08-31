"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import {
  changePasswordSchema,
  profileSchema,
  registerSchema,
  signInSchema,
  type AuthActionResult,
} from "@/lib/auth/schemas";
import {
  createCustomerSession,
  destroyCustomerSession,
  getCustomerIdentity,
  pruneExpiredSessions,
  requireCustomer,
} from "@/lib/auth/session";
import { db } from "@/lib/db";
import { limitByClient } from "@/lib/rate-limit";
import { getOrCreateCart } from "@/server/cart";

/**
 * Customer authentication.
 *
 * Passwords are only ever compared against a bcrypt hash, sign-in failures are
 * indistinguishable from an unknown email, and both routes are rate limited per
 * client. Sessions are opaque and server-side, so signing out is immediate.
 */

/** First message per field, which is all a form needs to show. */
function collectFieldErrors(error: {
  issues: readonly { path: readonly PropertyKey[]; message: string }[];
}) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in fieldErrors)) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export async function signInCustomer(input: unknown): Promise<AuthActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: collectFieldErrors(parsed.error),
    };
  }

  const limit = await limitByClient("sign-in", 8, 10 * 60_000);
  if (!limit.ok) {
    return { ok: false, message: "Too many attempts. Please wait a few minutes." };
  }

  const customer = await db.customer.findUnique({ where: { email: parsed.data.email } });
  const valid = await verifyPassword(parsed.data.password, customer?.passwordHash);

  // One message for both branches: never confirm whether an email is registered.
  if (!customer || !valid || !customer.active) {
    return { ok: false, message: "That email and password do not match." };
  }

  await createCustomerSession(customer.id);
  await pruneExpiredSessions();
  // Adopts the anonymous bag so nothing is lost by signing in mid-shop.
  await getOrCreateCart();

  revalidatePath("/account");
  return { ok: true, message: `Welcome back, ${customer.name.split(" ")[0]}.` };
}

export async function registerCustomer(input: unknown): Promise<AuthActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: collectFieldErrors(parsed.error),
    };
  }

  const limit = await limitByClient("register", 5, 30 * 60_000);
  if (!limit.ok) {
    return { ok: false, message: "Too many attempts. Please wait a few minutes." };
  }

  const existing = await db.customer.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existing) {
    return {
      ok: false,
      message: "An account with that email already exists. Sign in instead.",
      fieldErrors: { email: "Already registered" },
    };
  }

  const customer = await db.customer.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      passwordHash: await hashPassword(parsed.data.password),
      marketingOptIn: parsed.data.marketingOptIn,
    },
  });

  if (parsed.data.marketingOptIn) {
    await db.newsletterSubscriber.upsert({
      where: { email: customer.email },
      update: {},
      create: { email: customer.email, source: "account" },
    });
  }

  await createCustomerSession(customer.id);
  await getOrCreateCart();

  revalidatePath("/account");
  return { ok: true, message: "Your account is ready." };
}

export async function signOutCustomer() {
  await destroyCustomerSession();
  revalidatePath("/");
  redirect("/");
}

export async function updateProfile(input: unknown): Promise<AuthActionResult> {
  const customer = await requireCustomer();
  const parsed = profileSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: collectFieldErrors(parsed.error),
    };
  }

  await db.customer.update({
    where: { id: customer.id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      marketingOptIn: parsed.data.marketingOptIn,
    },
  });

  revalidatePath("/account/profile");
  return { ok: true, message: "Your details are saved." };
}

export async function changePassword(input: unknown): Promise<AuthActionResult> {
  const identity = await requireCustomer();
  const parsed = changePasswordSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the highlighted fields.",
      fieldErrors: collectFieldErrors(parsed.error),
    };
  }

  const limit = await limitByClient("change-password", 5, 15 * 60_000);
  if (!limit.ok) {
    return { ok: false, message: "Too many attempts. Please wait a few minutes." };
  }

  const customer = await db.customer.findUnique({ where: { id: identity.id } });
  const valid = await verifyPassword(parsed.data.currentPassword, customer?.passwordHash);

  if (!valid) {
    return {
      ok: false,
      message: "That current password is not right.",
      fieldErrors: { currentPassword: "Incorrect password" },
    };
  }

  await db.customer.update({
    where: { id: identity.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });

  // Every other session is invalidated — a password change should log out the
  // device that prompted it.
  await db.session.deleteMany({ where: { customerId: identity.id } });
  await createCustomerSession(identity.id);

  return { ok: true, message: "Password changed. Other devices have been signed out." };
}

/** Used by the header to decide what to render without exposing anything else. */
export async function currentCustomer() {
  return getCustomerIdentity();
}
