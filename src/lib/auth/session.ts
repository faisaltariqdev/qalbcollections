import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { cookies, headers } from "next/headers";
import { cache } from "react";

import { COOKIES, SESSION_TTL_DAYS, type AdminRole } from "@/lib/constants";
import { db } from "@/lib/db";
import { serverEnv } from "@/lib/env";

import { can, type Permission } from "./permissions";

/**
 * Opaque, revocable sessions.
 *
 * The cookie carries a 256-bit random token; only its SHA-256 digest is
 * persisted. A database leak therefore cannot be replayed as a login, and
 * signing out (or an admin deactivation) invalidates immediately — unlike a
 * self-contained JWT.
 */

export interface AdminIdentity {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}

export interface CustomerIdentity {
  id: string;
  name: string;
  email: string;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function newToken() {
  return randomBytes(32).toString("base64url");
}

function expiryDate() {
  return new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

async function setSessionCookie(name: string, token: string, expiresAt: Date) {
  const store = await cookies();
  store.set(name, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: serverEnv().NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

async function readSessionCookie(name: string) {
  const store = await cookies();
  return store.get(name)?.value ?? null;
}

async function currentUserAgent() {
  const headerList = await headers();
  return headerList.get("user-agent")?.slice(0, 255) ?? null;
}

// --- admin ---------------------------------------------------------------

export async function createAdminSession(adminUserId: string) {
  const token = newToken();
  const expiresAt = expiryDate();

  await db.session.create({
    data: {
      tokenHash: hashToken(token),
      adminUserId,
      expiresAt,
      userAgent: await currentUserAgent(),
    },
  });

  await setSessionCookie(COOKIES.adminSession, token, expiresAt);
}

/**
 * Resolves the signed-in administrator, or null. Wrapped in `cache` so a single
 * render performs one query no matter how many components ask.
 */
export const getAdminIdentity = cache(async (): Promise<AdminIdentity | null> => {
  const token = await readSessionCookie(COOKIES.adminSession);
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { adminUser: true },
  });

  if (!session?.adminUser || session.expiresAt < new Date() || !session.adminUser.active) {
    return null;
  }

  return {
    id: session.adminUser.id,
    name: session.adminUser.name,
    email: session.adminUser.email,
    role: session.adminUser.role as AdminRole,
  };
});

export async function destroyAdminSession() {
  const token = await readSessionCookie(COOKIES.adminSession);
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  (await cookies()).delete(COOKIES.adminSession);
}

export class AuthorizationError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Gate for every admin mutation. Throws rather than returning a falsy value so
 * a forgotten check cannot silently succeed.
 */
export async function requirePermission(permission: Permission): Promise<AdminIdentity> {
  const admin = await getAdminIdentity();
  if (!admin) throw new AuthorizationError("You must sign in to continue.");
  if (!can(admin.role, permission)) throw new AuthorizationError();
  return admin;
}

// --- customer ------------------------------------------------------------

export async function createCustomerSession(customerId: string) {
  const token = newToken();
  const expiresAt = expiryDate();

  await db.session.create({
    data: {
      tokenHash: hashToken(token),
      customerId,
      expiresAt,
      userAgent: await currentUserAgent(),
    },
  });

  await setSessionCookie(COOKIES.customerSession, token, expiresAt);
}

export const getCustomerIdentity = cache(async (): Promise<CustomerIdentity | null> => {
  const token = await readSessionCookie(COOKIES.customerSession);
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { customer: true },
  });

  if (!session?.customer || session.expiresAt < new Date() || !session.customer.active) {
    return null;
  }

  return {
    id: session.customer.id,
    name: session.customer.name,
    email: session.customer.email,
  };
});

export async function destroyCustomerSession() {
  const token = await readSessionCookie(COOKIES.customerSession);
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  (await cookies()).delete(COOKIES.customerSession);
}

export async function requireCustomer(): Promise<CustomerIdentity> {
  const customer = await getCustomerIdentity();
  if (!customer) throw new AuthorizationError("Please sign in to continue.");
  return customer;
}

// --- misc ----------------------------------------------------------------

/** Constant-time comparison for non-hashed secrets such as webhook tokens. */
export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Housekeeping for expired rows; called opportunistically after sign-in. */
export async function pruneExpiredSessions() {
  await db.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
