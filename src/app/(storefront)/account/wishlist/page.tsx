import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";

import { ProductGrid } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { requireCustomerPage } from "@/lib/auth/guards";
import { buildMetadata } from "@/lib/seo/metadata";
import { listProductsByIds } from "@/server/catalog";
import { getSavedWishlistIds } from "@/server/actions/wishlist-actions";

export const metadata: Metadata = buildMetadata({
  title: "Your wishlist",
  description: "The Qalb Collections pieces you have saved.",
  path: "/account/wishlist",
  noIndex: true,
});

export default async function AccountWishlistPage() {
  await requireCustomerPage("/account/wishlist");

  const ids = await getSavedWishlistIds();
  const products = await listProductsByIds(ids);

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<Heart className="size-5" />}
        title="Nothing saved yet"
        description="Tap the heart on any piece to keep it here. Your list follows you to every device you sign in from."
        actions={
          <Button asChild variant="primary">
            <Link href="/watches">Explore watches</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <h2 className="eyebrow border-b border-line pb-3 text-ink">
        {products.length} saved {products.length === 1 ? "piece" : "pieces"}
      </h2>
      <div className="mt-9">
        <ProductGrid products={products} columns={3} />
      </div>
    </div>
  );
}
