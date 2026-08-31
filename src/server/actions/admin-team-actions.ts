"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { hashPassword, passwordSchema } from "@/lib/auth/password";
import { AuthorizationError, requirePermission } from "@/lib/auth/session";
import { adminRoleSchema } from "@/lib/constants";
import { db } from "@/lib/db";
import { recordAudit } from "@/server/audit";

/**
 * Admin accounts.
 *
 * Guarded so an operator cannot lock the business out: the last active
 * super-admin cannot be demoted or deactivated, and nobody can change their own
 * role or switch themselves off.
 */

export interface TeamActionResult {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}

const inviteSchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(254),
  role: adminRoleSchema,
  password: passwordSchema,
});

function fieldErrorsFrom(issues: readonly { path: readonly PropertyKey[]; message: string }[]) {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in errors)) errors[key] = issue.message;
  }
  return errors;
}

export async function createAdminUser(input: unknown): Promise<TeamActionResult> {
  try {
    const actor = await requirePermission("admin.manage");
    const parsed = inviteSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Check the highlighted fields.",
        fieldErrors: fieldErrorsFrom(parsed.error.issues),
      };
    }

    const existing = await db.adminUser.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });
    if (existing) {
      return {
        ok: false,
        message: "An account with that email already exists.",
        fieldErrors: { email: "Already in use" },
      };
    }

    const user = await db.adminUser.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        passwordHash: await hashPassword(parsed.data.password),
      },
    });

    await recordAudit({
      actor,
      action: "admin.create",
      entity: "AdminUser",
      entityId: user.id,
      summary: `${user.email} as ${user.role}`,
    });

    revalidatePath("/admin/team");
    return { ok: true, message: `${user.name} can now sign in.` };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}

const updateSchema = z.object({
  id: z.string().min(1),
  role: adminRoleSchema.optional(),
  active: z.boolean().optional(),
});

export async function updateAdminUser(input: unknown): Promise<TeamActionResult> {
  try {
    const actor = await requirePermission("admin.manage");
    const parsed = updateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, message: "That request was not valid." };

    const target = await db.adminUser.findUnique({
      where: { id: parsed.data.id },
      select: { id: true, email: true, role: true, active: true },
    });
    if (!target) return { ok: false, message: "That account no longer exists." };

    if (target.id === actor.id) {
      return { ok: false, message: "Ask another super-admin to change your own access." };
    }

    const losingSuperAdmin =
      target.role === "SUPER_ADMIN" &&
      ((parsed.data.role !== undefined && parsed.data.role !== "SUPER_ADMIN") ||
        parsed.data.active === false);

    if (losingSuperAdmin) {
      const remaining = await db.adminUser.count({
        where: { role: "SUPER_ADMIN", active: true, id: { not: target.id } },
      });
      if (remaining === 0) {
        return {
          ok: false,
          message: "This is the last active super-admin. Promote someone else first.",
        };
      }
    }

    const user = await db.adminUser.update({
      where: { id: target.id },
      data: { role: parsed.data.role, active: parsed.data.active },
      select: { id: true, email: true, role: true, active: true },
    });

    // Revoked access has to take effect now, not whenever the cookie expires.
    if (user.active === false) {
      await db.session.deleteMany({ where: { adminUserId: user.id } });
    }

    await recordAudit({
      actor,
      action: "admin.update",
      entity: "AdminUser",
      entityId: user.id,
      summary: `${user.email}: ${user.role}, ${user.active ? "active" : "deactivated"}`,
    });

    revalidatePath("/admin/team");
    return { ok: true, message: "Access updated." };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}

const resetSchema = z.object({ id: z.string().min(1), password: passwordSchema });

export async function resetAdminPassword(input: unknown): Promise<TeamActionResult> {
  try {
    const actor = await requirePermission("admin.manage");
    const parsed = resetSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: "Choose a stronger password.",
        fieldErrors: fieldErrorsFrom(parsed.error.issues),
      };
    }

    const user = await db.adminUser.update({
      where: { id: parsed.data.id },
      data: { passwordHash: await hashPassword(parsed.data.password) },
      select: { id: true, email: true },
    });

    // Everyone signed in as that account is turned out, in case the reset is
    // in response to a compromise.
    await db.session.deleteMany({ where: { adminUserId: user.id } });

    await recordAudit({
      actor,
      action: "admin.password_reset",
      entity: "AdminUser",
      entityId: user.id,
      summary: user.email,
    });

    revalidatePath("/admin/team");
    return { ok: true, message: "Password reset. Existing sessions were signed out." };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}
