"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AuthorizationError, requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { toMinorUnits } from "@/lib/money";
import { recordAudit } from "@/server/audit";

/**
 * Coupons.
 *
 * A PERCENT coupon stores whole percent; a FIXED one stores minor units. Both
 * are integers, which is what `calculateTotals` expects.
 */

const couponSchema = z
  .object({
    id: z.string().optional(),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, "Codes need at least three characters")
      .max(32)
      .regex(/^[A-Z0-9-]+$/, "Letters, numbers and hyphens only"),
    description: z.string().trim().max(160).optional(),
    type: z.enum(["PERCENT", "FIXED"]),
    /** Percent for PERCENT, major currency units for FIXED. */
    value: z.coerce.number().positive("Enter a value"),
    minSubtotal: z.coerce.number().min(0).default(0),
    maxRedemptions: z
      .preprocess(
        (raw) => (raw === "" || raw === null || raw === undefined ? undefined : Number(raw)),
        z.number().int().positive().max(1_000_000).optional(),
      ),
    active: z.boolean().default(true),
    startsAt: z.string().trim().optional(),
    endsAt: z.string().trim().optional(),
    currency: z.string().trim().length(3).default("PKR"),
  })
  .refine((value) => value.type !== "PERCENT" || value.value <= 100, {
    message: "A percentage cannot exceed 100",
    path: ["value"],
  });

export interface CouponActionResult {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
}

function parseDate(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function saveCoupon(input: unknown): Promise<CouponActionResult> {
  try {
    const admin = await requirePermission("settings.write");
    const parsed = couponSchema.safeParse(input);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !(key in fieldErrors)) fieldErrors[key] = issue.message;
      }
      return { ok: false, message: "Check the highlighted fields.", fieldErrors };
    }

    const value = parsed.data;
    const clash = await db.coupon.findFirst({
      where: { code: value.code, id: value.id ? { not: value.id } : undefined },
      select: { id: true },
    });
    if (clash) {
      return { ok: false, message: "That code already exists.", fieldErrors: { code: "Already in use" } };
    }

    const data = {
      code: value.code,
      description: value.description || null,
      type: value.type,
      value:
        value.type === "PERCENT"
          ? Math.round(value.value)
          : toMinorUnits(value.value, value.currency),
      minSubtotal: toMinorUnits(value.minSubtotal, value.currency),
      maxRedemptions: value.maxRedemptions ?? null,
      active: value.active,
      startsAt: parseDate(value.startsAt),
      endsAt: parseDate(value.endsAt),
    };

    const coupon = value.id
      ? await db.coupon.update({ where: { id: value.id }, data })
      : await db.coupon.create({ data });

    await recordAudit({
      actor: admin,
      action: value.id ? "coupon.update" : "coupon.create",
      entity: "Coupon",
      entityId: coupon.id,
      summary: `${coupon.code} (${coupon.active ? "active" : "off"})`,
    });

    revalidatePath("/admin/coupons");
    return { ok: true, message: "Coupon saved." };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}

export async function deleteCoupon(id: string): Promise<CouponActionResult> {
  try {
    const admin = await requirePermission("settings.write");
    const coupon = await db.coupon.findUnique({
      where: { id },
      select: { code: true, redemptions: true },
    });
    if (!coupon) return { ok: false, message: "That coupon no longer exists." };

    // A code that has been used is part of the order record; switch it off
    // rather than erasing the history behind those discounts.
    if (coupon.redemptions > 0) {
      await db.coupon.update({ where: { id }, data: { active: false } });
      await recordAudit({
        actor: admin,
        action: "coupon.disable",
        entity: "Coupon",
        entityId: id,
        summary: coupon.code,
      });
      revalidatePath("/admin/coupons");
      return {
        ok: true,
        message: "This code has been redeemed before, so it was switched off rather than deleted.",
      };
    }

    await db.coupon.delete({ where: { id } });
    await recordAudit({
      actor: admin,
      action: "coupon.delete",
      entity: "Coupon",
      entityId: id,
      summary: coupon.code,
    });

    revalidatePath("/admin/coupons");
    return { ok: true, message: "Coupon deleted." };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}
