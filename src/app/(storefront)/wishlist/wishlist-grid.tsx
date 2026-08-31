"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

import { ProductGrid } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/primitives";
import { useHydratedProducts } from "@/hooks/use-hydrated-products";
import { useWishlist } from "@/hooks/use-wishlist";
import type { ProductCardData } from "@/server/catalog-types";

/**
 * The wishlist as the visitor's browser knows it.
 *
 * The list of ids is local — which is what lets a guest keep one without an
 * account — so the products are hydrated after mount. Signed-in customers see
 * the same list, mirrored to their account on every change.
 */
export function WishlistGrid() {
  const { ids, ready, count } = useWishlist();
  const products = useHydratedProducts<ProductCardData>("/api/products/by-ids", ids, ready);

  if (products === null) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index}>
            <Skeleton className="aspect-4/5 w-full" />
            <Skeleton className="mt-4 h-3 w-16" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="size-5" />}
        title="Nothing saved yet"
        description="Tap the heart on any piece to keep it here while you decide. Sign in and your list follows you between devices."
        actions={
          <>
            <Button asChild variant="primary">
              <Link href="/watches">Explore watches</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/find-your-timepiece">Find your timepiece</Link>
            </Button>
          </>
        }
      />
    );
  }

  return (
    <>
      <p className="eyebrow border-b border-line pb-3 text-muted">
        {count} saved {count === 1 ? "piece" : "pieces"}
      </p>
      <div className="mt-10">
        <ProductGrid products={products} columns={4} />
      </div>
    </>
  );
}
