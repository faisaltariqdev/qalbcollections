"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/lib/db";
import { getOrCreateCart } from "@/server/cart";

/**
 * Cart mutations.
 *
 * Server Actions carry Next.js' built-in origin check, and every input is
 * re-validated here — the quantity stepper in the UI is a convenience, not a
 * constraint.
 */

export interface ActionResult {
  ok: boolean;
  message?: string;
}

const addSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(10),
});

export async function addToCart(input: z.input<typeof addSchema>): Promise<ActionResult> {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "That request was not valid." };

  const product = await db.product.findUnique({
    where: { id: parsed.data.productId },
    select: {
      id: true,
      name: true,
      status: true,
      comingSoon: true,
      stock: true,
      allowBackorder: true,
      category: { select: { status: true } },
    },
  });

  if (!product || product.status !== "ACTIVE" || product.category.status === "HIDDEN") {
    return { ok: false, message: "That piece is no longer available." };
  }
  if (product.comingSoon) {
    return { ok: false, message: "This piece has not been released yet." };
  }

  const cart = await getOrCreateCart();
  const existing = await db.cartItem.findFirst({
    where: { cartId: cart.id, productId: product.id, variantId: null },
  });

  const requested = (existing?.quantity ?? 0) + parsed.data.quantity;
  const ceiling = product.allowBackorder ? 10 : Math.min(product.stock, 10);

  if (ceiling <= 0) {
    return { ok: false, message: "That piece is out of stock." };
  }
  if (requested > ceiling) {
    return {
      ok: false,
      message:
        existing && existing.quantity >= ceiling
          ? `Only ${ceiling} available — already in your bag.`
          : `Only ${ceiling} available.`,
    };
  }

  if (existing) {
    await db.cartItem.update({ where: { id: existing.id }, data: { quantity: requested } });
  } else {
    await db.cartItem.create({
      data: { cartId: cart.id, productId: product.id, quantity: parsed.data.quantity },
    });
  }

  revalidatePath("/cart");
  return { ok: true, message: `${product.name} added to your bag.` };
}

const updateSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.coerce.number().int().min(0).max(10),
});

export async function updateCartItem(input: z.input<typeof updateSchema>): Promise<ActionResult> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "That request was not valid." };

  const cart = await getOrCreateCart();
  // Scoped to this cart so an item id from elsewhere cannot be manipulated.
  const item = await db.cartItem.findFirst({
    where: { id: parsed.data.itemId, cartId: cart.id },
    include: { product: { select: { stock: true, allowBackorder: true } } },
  });
  if (!item) return { ok: false, message: "That item is no longer in your bag." };

  if (parsed.data.quantity === 0) {
    await db.cartItem.delete({ where: { id: item.id } });
    revalidatePath("/cart");
    return { ok: true, message: "Removed from your bag." };
  }

  const ceiling = item.product.allowBackorder ? 10 : Math.min(item.product.stock, 10);
  if (parsed.data.quantity > ceiling) {
    return { ok: false, message: `Only ${ceiling} available.` };
  }

  await db.cartItem.update({ where: { id: item.id }, data: { quantity: parsed.data.quantity } });
  revalidatePath("/cart");
  return { ok: true };
}

export async function removeCartItem(itemId: string): Promise<ActionResult> {
  return updateCartItem({ itemId, quantity: 0 });
}

export async function clearCart(): Promise<ActionResult> {
  const cart = await getOrCreateCart();
  await db.cartItem.deleteMany({ where: { cartId: cart.id } });
  revalidatePath("/cart");
  return { ok: true, message: "Your bag is empty." };
}
