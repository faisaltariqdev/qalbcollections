"use client";

import { AddToCartButton, type AddToCartProduct } from "@/components/product/add-to-cart-button";
import { formatMoney } from "@/lib/money";

/**
 * Mobile purchase bar — price and add-to-bag stay in reach after the hero
 * scrolls away, without competing with the desktop sticky gallery.
 */
export function StickyBuyBar({
  product,
  price,
  currency,
}: {
  product: AddToCartProduct;
  price: number;
  currency: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-nav/95 px-4 py-3 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-[1320px] items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.6875rem] uppercase tracking-[0.16em] text-burgundy">
            {product.brand}
          </p>
          <p className="mt-0.5 truncate font-display text-lg leading-tight text-ink" data-numeric>
            {formatMoney(price, currency)}
          </p>
        </div>
        <AddToCartButton
          product={product}
          size="md"
          block={false}
          className="h-12 min-w-[10rem] px-5"
        />
      </div>
    </div>
  );
}
