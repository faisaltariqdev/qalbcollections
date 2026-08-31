import "server-only";

import { redirect } from "next/navigation";

import { getAdminIdentity, getCustomerIdentity } from "./session";
import { can, type Permission } from "./permissions";

/**
 * Page-level guards.
 *
 * These redirect; `requireCustomer` / `requirePermission` in `session.ts` throw
 * and belong in Server Actions and route handlers. `src/proxy.ts` turns the
 * common case into a 307 before rendering starts — these cover a cookie that
 * exists but is no longer valid.
 */

export async function requireCustomerPage(returnTo = "/account") {
  const customer = await getCustomerIdentity();
  if (!customer) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  return customer;
}

export async function requireAdminPage(permission?: Permission) {
  const admin = await getAdminIdentity();
  if (!admin) redirect("/admin/sign-in");
  if (permission && !can(admin.role, permission)) redirect("/admin");
  return admin;
}
