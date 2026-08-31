"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Price } from "@/components/product/price";
import { Spinner } from "@/components/ui/primitives";
import { useCart } from "@/components/providers/cart-provider";
import { track } from "@/lib/analytics";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { removeCartItem, updateCartItem } from "@/server/actions/cart-actions";
import type { CartLine } from "@/server/cart";

/**
 * Editable cart lines — full poster, readable type, clear quantity.
 */
export function CartLines({ lines }: { lines: CartLine[] }) {
  const { refresh } = useCart();
  const [pending, startTransition] = useTransition();

  function change(line: CartLine, quantity: number) {
    startTransition(async () => {
      const result =
        quantity === 0
          ? await removeCartItem(line.id)
          : await updateCartItem({ itemId: line.id, quantity });

      if (!result.ok) {
        toast.error(result.message ?? "That could not be updated.");
        return;
      }

      if (quantity === 0) {
        track("remove_from_cart", {
          item: {
            id: line.productId,
            name: line.name,
            brand: line.brand,
            price: line.unitPrice,
            currency: line.currency,
            quantity: line.quantity,
          },
        });
      }

      refresh();
      if (result.message) toast.success(result.message);
    });
  }

  return (
    <ul
      className={cn(
        "space-y-4",
        pending && "pointer-events-none opacity-60 transition-opacity",
      )}
    >
      {lines.map((line) => (
        <li
          key={line.id}
          className="flex gap-5 border border-ink/10 bg-cream/50 p-4 sm:gap-6 sm:p-5"
        >
          <Link
            href={`/product/${line.slug}`}
            className="relative aspect-3/4 w-24 shrink-0 overflow-hidden border border-champ/25 bg-void sm:w-32"
          >
            {line.imageUrl ? (
              <Image
                src={line.imageUrl}
                alt={line.imageAlt}
                fill
                sizes="112px"
                quality={80}
                className="object-contain object-center"
              />
            ) : null}
          </Link>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-burgundy">
                  {line.brand}
                </p>
                <h2 className="mt-1.5 font-display text-xl font-medium leading-snug text-ink">
                  <Link href={`/product/${line.slug}`} className="transition-colors hover:text-burgundy">
                    {line.name}
                  </Link>
                </h2>
                <p className="mt-1.5 text-sm text-ink-soft" data-numeric>
                  Ref. {line.sku}
                </p>
              </div>

              <button
                type="button"
                onClick={() => change(line, 0)}
                aria-label={`Remove ${line.name} from your bag`}
                className="flex size-9 shrink-0 items-center justify-center text-dust transition-colors hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-5">
              <div className="inline-flex items-center border border-ink/20 bg-nav">
                <button
                  type="button"
                  onClick={() => change(line, line.quantity - 1)}
                  disabled={line.quantity <= 1}
                  aria-label="Decrease quantity"
                  className="flex size-11 items-center justify-center text-ink transition-colors hover:bg-burgundy hover:text-nav disabled:opacity-35"
                >
                  <Minus className="size-3.5" />
                </button>
                <span
                  className="min-w-10 text-center text-sm font-semibold text-ink"
                  aria-live="polite"
                  data-numeric
                >
                  {line.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => change(line, line.quantity + 1)}
                  disabled={line.quantity >= Math.min(line.available, 10)}
                  aria-label="Increase quantity"
                  className="flex size-11 items-center justify-center text-ink transition-colors hover:bg-burgundy hover:text-nav disabled:opacity-35"
                >
                  <Plus className="size-3.5" />
                </button>
              </div>

              <div className="text-right">
                <Price price={line.lineTotal} currency={line.currency} size="lg" />
                {line.quantity > 1 ? (
                  <p className="mt-1 text-sm text-dust" data-numeric>
                    {formatMoney(line.unitPrice, line.currency)} each
                  </p>
                ) : null}
              </div>
            </div>

            {line.available <= 3 ? (
              <p className="mt-3 text-sm font-medium text-warning" data-numeric>
                Only {line.available} left in stock
              </p>
            ) : null}
          </div>
        </li>
      ))}

      {pending ? (
        <li className="flex items-center gap-3 py-4 text-sm text-dust">
          <Spinner className="size-3.5" /> Updating your bag
        </li>
      ) : null}
    </ul>
  );
}
