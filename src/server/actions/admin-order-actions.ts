"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { AuthorizationError, requirePermission } from "@/lib/auth/session";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
  orderStatusSchema,
  paymentStatusSchema,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/constants";
import { db } from "@/lib/db";
import { recordAudit } from "@/server/audit";

/**
 * Order operations.
 *
 * Status changes follow the allowed transition map rather than a free-for-all,
 * every change appends an event the customer can see, and cancelling returns
 * stock to the catalogue.
 */

const statusInput = z.object({
  orderNumber: z.string().min(1),
  status: orderStatusSchema,
  note: z.string().trim().max(500).optional(),
});

export interface OrderActionResult {
  ok: boolean;
  message: string;
}

export async function updateOrderStatus(input: unknown): Promise<OrderActionResult> {
  try {
    const admin = await requirePermission("order.write");
    const parsed = statusInput.safeParse(input);
    if (!parsed.success) return { ok: false, message: "That status is not recognised." };

    const order = await db.order.findUnique({
      where: { orderNumber: parsed.data.orderNumber },
      include: { items: { select: { productId: true, quantity: true } } },
    });
    if (!order) return { ok: false, message: "That order no longer exists." };

    const current = order.status as OrderStatus;
    const next = parsed.data.status;

    if (current === next) return { ok: false, message: "The order is already in that state." };
    if (!ORDER_STATUS_TRANSITIONS[current].includes(next)) {
      return {
        ok: false,
        message: `An order that is ${ORDER_STATUS_LABELS[current].toLowerCase()} cannot become ${ORDER_STATUS_LABELS[next].toLowerCase()}.`,
      };
    }

    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: next,
          // Delivery on a cash-on-delivery order is the moment it is paid.
          paymentStatus:
            next === "DELIVERED" && order.paymentStatus !== "PAID" ? "PAID" : undefined,
        },
      });

      // Stock was reserved when the order was placed, so a cancellation or
      // return has to give it back.
      if (next === "CANCELLED" || next === "RETURNED") {
        for (const item of order.items) {
          if (!item.productId) continue;
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: "status",
          message: parsed.data.note
            ? `${ORDER_STATUS_LABELS[next]} — ${parsed.data.note}`
            : `Order marked ${ORDER_STATUS_LABELS[next].toLowerCase()}`,
          actor: admin.email,
        },
      });
    });

    await recordAudit({
      actor: admin,
      action: "order.status",
      entity: "Order",
      entityId: order.id,
      summary: `${order.orderNumber}: ${current} → ${next}`,
    });

    revalidatePath(`/admin/orders/${order.orderNumber}`);
    revalidatePath("/admin/orders");
    revalidatePath("/account/orders");

    return { ok: true, message: `Marked ${ORDER_STATUS_LABELS[next].toLowerCase()}.` };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}

const paymentInput = z.object({
  orderNumber: z.string().min(1),
  paymentStatus: paymentStatusSchema,
  reference: z.string().trim().max(120).optional(),
});

export async function updatePaymentStatus(input: unknown): Promise<OrderActionResult> {
  try {
    const admin = await requirePermission("order.write");
    const parsed = paymentInput.safeParse(input);
    if (!parsed.success) return { ok: false, message: "That payment state is not recognised." };

    const order = await db.order.findUnique({
      where: { orderNumber: parsed.data.orderNumber },
      select: { id: true, orderNumber: true, paymentStatus: true },
    });
    if (!order) return { ok: false, message: "That order no longer exists." };

    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: parsed.data.paymentStatus,
          paymentRef: parsed.data.reference || undefined,
        },
      });
      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: "payment",
          message: `Payment marked ${PAYMENT_STATUS_LABELS[parsed.data.paymentStatus].toLowerCase()}${
            parsed.data.reference ? ` (${parsed.data.reference})` : ""
          }`,
          actor: admin.email,
        },
      });
    });

    await recordAudit({
      actor: admin,
      action: "order.payment",
      entity: "Order",
      entityId: order.id,
      summary: `${order.orderNumber}: payment ${parsed.data.paymentStatus}`,
    });

    revalidatePath(`/admin/orders/${order.orderNumber}`);
    revalidatePath("/admin/orders");
    return { ok: true, message: "Payment updated." };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}

const noteInput = z.object({
  orderNumber: z.string().min(1),
  message: z.string().trim().min(2).max(1000),
});

/** An internal note, kept on the same timeline as status changes. */
export async function addOrderNote(input: unknown): Promise<OrderActionResult> {
  try {
    const admin = await requirePermission("order.write");
    const parsed = noteInput.safeParse(input);
    if (!parsed.success) return { ok: false, message: "Write a short note first." };

    const order = await db.order.findUnique({
      where: { orderNumber: parsed.data.orderNumber },
      select: { id: true },
    });
    if (!order) return { ok: false, message: "That order no longer exists." };

    await db.orderEvent.create({
      data: {
        orderId: order.id,
        type: "note",
        message: parsed.data.message,
        actor: admin.email,
      },
    });

    revalidatePath(`/admin/orders/${parsed.data.orderNumber}`);
    return { ok: true, message: "Note added." };
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, message: error.message };
    throw error;
  }
}
