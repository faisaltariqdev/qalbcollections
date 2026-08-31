"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { Fragment, type ReactNode } from "react";

import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { Price } from "@/components/product/price";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/primitives";
import { useCompare } from "@/hooks/use-compare";
import { useHydratedProducts } from "@/hooks/use-hydrated-products";
import type { ComparisonProduct } from "@/server/catalog-types";

/**
 * Side-by-side comparison.
 *
 * The selection lives in the browser, so the table hydrates from an API call.
 * Rows are the union of every selected piece's specification keys, which lets a
 * watch and a future perfume sit in the same table without special-casing.
 */
export function CompareTable() {
  const { ids, ready, remove, clear } = useCompare();
  const products = useHydratedProducts<ComparisonProduct>("/api/products/compare", ids, ready);

  if (products === null) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="aspect-4/5" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title="Nothing selected yet"
        description="Add pieces to compare from any listing or product page, and they will line up here."
        actions={
          <Button asChild variant="primary">
            <Link href="/watches">Browse watches</Link>
          </Button>
        }
      />
    );
  }

  // Union of specification keys, first appearance wins the ordering — each
  // category already sorts its own attributes sensibly.
  const rowKeys: { key: string; label: string }[] = [];
  for (const product of products) {
    for (const row of product.specifications) {
      if (!rowKeys.some((existing) => existing.key === row.key)) {
        rowKeys.push({ key: row.key, label: row.label });
      }
    }
  }

  const columnWidth = `minmax(11rem, 1fr)`;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-xs text-muted" data-numeric>
          {products.length} {products.length === 1 ? "piece" : "pieces"}
        </p>
        <button
          type="button"
          onClick={clear}
          className="eyebrow text-[0.5625rem] text-muted transition-colors hover:text-ink"
        >
          Clear all
        </button>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div
          className="grid min-w-fit gap-x-6"
          style={{
            gridTemplateColumns: `8.5rem repeat(${products.length}, ${columnWidth})`,
          }}
        >
          {/* Header row */}
          <div aria-hidden />
          {products.map((product) => (
            <div key={product.id} className="pb-8">
              <div className="relative">
                <Link href={`/product/${product.slug}`} className="group block">
                  <div className="relative aspect-4/5 overflow-hidden bg-shell">
                    {product.primaryImage ? (
                      <Image
                        src={product.primaryImage.url}
                        alt={product.primaryImage.alt}
                        fill
                        sizes="(max-width: 640px) 60vw, 22vw"
                        quality={90}
                        className="object-cover transition-transform duration-700 ease-[var(--ease-luxe)] group-hover:scale-[1.03]"
                      />
                    ) : null}
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => remove(product.id)}
                  aria-label={`Remove ${product.name} from comparison`}
                  className="absolute right-2 top-2 flex size-8 items-center justify-center bg-canvas/90 text-muted transition-colors hover:text-ink"
                >
                  <X className="size-3.5" />
                </button>
              </div>

              <p className="eyebrow mt-4 text-[0.5625rem] text-qalb">{product.brand}</p>
              <h2 className="mt-2 font-display text-lg leading-snug text-ink">
                <Link href={`/product/${product.slug}`} className="link-sweep">
                  {product.name}
                </Link>
              </h2>
              <Price
                price={product.price}
                compareAtPrice={product.compareAtPrice}
                currency={product.currency}
                className="mt-3"
              />
            </div>
          ))}

          {/* Availability */}
          <SpecLabel>Availability</SpecLabel>
          {products.map((product) => (
            <SpecCell key={product.id}>
              {product.comingSoon
                ? "Coming soon"
                : product.inStock
                  ? product.lowStock
                    ? "Low stock"
                    : "In stock"
                  : "Sold out"}
            </SpecCell>
          ))}

          <SpecLabel>Reference</SpecLabel>
          {products.map((product) => (
            <SpecCell key={product.id}>{product.sku}</SpecCell>
          ))}

          {rowKeys.map((row) => (
            <Fragment key={row.key}>
              <SpecLabel>{row.label}</SpecLabel>
              {products.map((product) => (
                <SpecCell key={product.id}>
                  {product.specifications.find((spec) => spec.key === row.key)?.value ?? "—"}
                </SpecCell>
              ))}
            </Fragment>
          ))}

          <div aria-hidden className="pt-8" />
          {products.map((product) => (
            <div key={product.id} className="pt-8">
              <AddToCartButton
                product={{
                  id: product.id,
                  name: product.name,
                  brand: product.brand,
                  price: product.price,
                  currency: product.currency,
                  category: product.category.name,
                  inStock: product.inStock,
                  comingSoon: product.comingSoon,
                }}
                size="md"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SpecLabel({ children }: { children: ReactNode }) {
  return <div className="border-t border-line-soft py-4 text-xs text-muted">{children}</div>;
}

function SpecCell({ children }: { children: ReactNode }) {
  return (
    <div className="border-t border-line-soft py-4 text-sm text-ink" data-numeric>
      {children}
    </div>
  );
}
