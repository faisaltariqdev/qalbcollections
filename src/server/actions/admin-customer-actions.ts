"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AuthorizationError, requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { recordAudit } from "@/server/audit";

const input = z.object({ customerId: z.string().min(1), active: z.boolean() });

/**
 * Deactivating a customer ends their sessions immediately and stops them
 * signing in again. It never touches their orders, which are a record of what
 * happened and must stay intact.
 */
export async function setCustomerActive(
  raw: unknown,
): Promise<{ ok: boolean; message: string }> {
  try {
    const admin = await requirePermission("customer.write");
    const parsed = input.safeParse(raw);
    if (!parsed.success) return { ok: false, message: "That request was not valid." };

    const customer = await db.customer.update({
      where: { id: parsed.data.customerId },
      data: { active: parsed.data.active },
      select: { id: true, email: true },
    });

    if (!parsed.data.active) {
      await db.session.deleteMany({ where: { customerId: customer.id } });
    }

    await recordAudit({
      actor: admin,
      action: parsed.data.active ? "customer.activate" : "customer.deactivate",
      entity: "Customer",
      entityId: customer.id,
      summary: customer.email,
    });

    revalidatePath(`/admin/customers/${customer.id}`);
    revalidatePath("/admin/customers");

    return {
      ok: true,
      message: parsed.data.active ? "Account reactivated." : "Account deactivated.",
    };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}
