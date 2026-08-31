"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AuthorizationError, requirePermission } from "@/lib/auth/session";
import { db } from "@/lib/db";

const input = z.object({
  id: z.string().min(1),
  status: z.enum(["NEW", "READ", "ANSWERED", "ARCHIVED"]),
});

/** Moves an enquiry along so the team knows what still needs a reply. */
export async function setMessageStatus(raw: unknown): Promise<{ ok: boolean; message: string }> {
  try {
    await requirePermission("customer.read");
    const parsed = input.safeParse(raw);
    if (!parsed.success) return { ok: false, message: "That state is not recognised." };

    await db.contactMessage.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
    });

    revalidatePath("/admin/messages");
    return { ok: true, message: "Enquiry updated." };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}
