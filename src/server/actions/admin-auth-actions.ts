"use server";

import { redirect } from "next/navigation";

import { verifyPassword } from "@/lib/auth/password";
import { signInSchema, type AuthActionResult } from "@/lib/auth/schemas";
import {
  createAdminSession,
  destroyAdminSession,
  getAdminIdentity,
  pruneExpiredSessions,
} from "@/lib/auth/session";
import { db } from "@/lib/db";
import { limitByClient } from "@/lib/rate-limit";
import { recordAudit } from "@/server/audit";

/**
 * Administrator sign-in.
 *
 * Stricter than the storefront: fewer attempts per window, no self-service
 * registration, and every outcome recorded in the audit log.
 */
export async function signInAdmin(input: unknown): Promise<AuthActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Enter your email and password." };
  }

  const limit = await limitByClient("admin-sign-in", 5, 15 * 60_000);
  if (!limit.ok) {
    return { ok: false, message: "Too many attempts. Try again later." };
  }

  const admin = await db.adminUser.findUnique({ where: { email: parsed.data.email } });
  const valid = await verifyPassword(parsed.data.password, admin?.passwordHash);

  if (!admin || !valid || !admin.active) {
    await recordAudit({
      actor: null,
      action: "admin.sign_in_failed",
      entity: "AdminUser",
      entityId: admin?.id ?? null,
      summary: `Failed sign-in for ${parsed.data.email}`,
    });
    return { ok: false, message: "Those credentials are not valid." };
  }

  await createAdminSession(admin.id);
  await pruneExpiredSessions();
  await db.adminUser.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });

  await recordAudit({
    actor: admin,
    action: "admin.sign_in",
    entity: "AdminUser",
    entityId: admin.id,
    summary: "Signed in",
  });

  return { ok: true, message: `Welcome back, ${admin.name.split(" ")[0]}.` };
}

export async function signOutAdmin() {
  const admin = await getAdminIdentity();
  await destroyAdminSession();
  if (admin) {
    await recordAudit({
      actor: admin,
      action: "admin.sign_out",
      entity: "AdminUser",
      entityId: admin.id,
      summary: "Signed out",
    });
  }
  redirect("/admin/sign-in");
}
