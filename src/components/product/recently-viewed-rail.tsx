"use client";

import { ProductGrid } from "@/components/product/product-card";
import { Container, Section, SectionHeading } from "@/components/ui/primitives";
import { useHydratedProducts } from "@/hooks/use-hydrated-products";
import { useLocalCollection } from "@/hooks/use-local-collection";
import { MAX_RECENTLY_VIEWED, STORAGE_KEYS } from "@/lib/constants";
import type { ProductCardData } from "@/server/catalog-types";

/**
 * Recently viewed rail.
 *
 * The id list lives in the browser, so the products themselves are fetched
 * after mount. The section is absent — not empty — until there is something
 * worth showing, and the current product is excluded.
 */
export function RecentlyViewedRail({ excludeId }: { excludeId?: string }) {
  const { ids, ready } = useLocalCollection(STORAGE_KEYS.recentlyViewed, MAX_RECENTLY_VIEWED);
  const wanted = ids.filter((id) => id !== excludeId).slice(0, 4);
  const products = useHydratedProducts<ProductCardData>("/api/products/by-ids", wanted, ready);

  if (!products || products.length === 0) return null;

  return (
    <Section tone="shell" spacing="tight">
      <Container>
        <SectionHeading eyebrow="Continue where you left off" title="Recently viewed" level={3} />
        <div className="mt-10">
          <ProductGrid products={products} columns={4} size="compact" />
        </div>
      </Container>
    </Section>
  );
}
