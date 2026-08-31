"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";
import { useCallback, useState } from "react";

import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { Price } from "@/components/product/price";
import { WishlistButton } from "@/components/product/wishlist-button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge, Skeleton } from "@/components/ui/primitives";
import { track } from "@/lib/analytics";
import type { ProductBadge, ProductImageData, SpecificationRow } from "@/server/catalog-types";

interface QuickViewPayload {
  id: string;
  name: string;
  slug: string;
  brand: string;
  sku: string;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  images: ProductImageData[];
  inStock: boolean;
  lowStock: boolean;
  comingSoon: boolean;
  stock: number;
  category: { name: string; slug: string };
  badges: ProductBadge[];
  highlights: SpecificationRow[];
}

/**
 * Quick view lets a shopper judge a piece without losing their place in the
 * grid — the single highest-impact addition to a listing page. Data is fetched
 * on open, so it costs nothing until used.
 */
export function QuickView({ slug, productId }: { slug: string; productId: string }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<QuickViewPayload | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    if (data) return;
    try {
      const response = await fetch(`/api/products/${slug}/quick-view`);
      if (!response.ok) throw new Error("Failed");
      setData((await response.json()) as QuickViewPayload);
    } catch {
      setFailed(true);
    }
  }, [data, slug]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          track("quick_view_opened", { productId });
          void load();
        }
      }}
    >
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
          track("quick_view_opened", { productId });
          void load();
        }}
        className="hidden w-full items-center justify-center gap-2 border border-champ bg-transparent py-2.5 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-champ transition-colors hover:bg-champ hover:text-void lg:flex"
      >
        <Eye className="size-3.5" />
        Quick view
      </button>

      <DialogContent className="max-w-4xl">
        {failed ? (
          <div className="p-10 text-center">
            <p className="text-sm text-muted">
              That could not be loaded.{" "}
              <Link href={`/product/${slug}`} className="text-ink underline underline-offset-4">
                Open the full page
              </Link>
              .
            </p>
          </div>
        ) : !data ? (
          <div className="grid gap-0 sm:grid-cols-2">
            <Skeleton className="aspect-4/5" />
            <div className="space-y-4 p-8">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ) : (
          <div className="grid gap-0 sm:grid-cols-2">
            <div className="relative aspect-4/5 bg-shell sm:aspect-auto sm:min-h-[30rem]">
              {data.images[0] ? (
                <Image
                  src={data.images[0].url}
                  alt={data.images[0].alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 40vw"
                  quality={90}
                  className="object-cover"
                />
              ) : null}
              {data.badges.length > 0 ? (
                <div className="absolute left-4 top-4 flex flex-col items-start gap-2">
                  {data.badges.map((badge) => (
                    <Badge key={badge.label} tone={badge.tone}>
                      {badge.label}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col p-7 sm:p-9">
              <p className="eyebrow text-muted">{data.brand}</p>
              <DialogTitle className="mt-3 font-display text-2xl leading-tight text-ink">
                {data.name}
              </DialogTitle>

              <Price
                price={data.price}
                compareAtPrice={data.compareAtPrice}
                currency={data.currency}
                size="lg"
                showSaving
                className="mt-4"
              />

              {data.shortDescription ? (
                <p className="mt-5 text-sm leading-relaxed text-muted">{data.shortDescription}</p>
              ) : null}

              {data.highlights.length > 0 ? (
                <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line pt-6">
                  {data.highlights.slice(0, 4).map((spec) => (
                    <div key={spec.key}>
                      <dt className="eyebrow text-[0.5rem] text-faint">{spec.label}</dt>
                      <dd className="mt-1 text-xs text-ink-soft">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              <div className="mt-auto pt-8">
                <div className="flex gap-3">
                  <AddToCartButton
                    product={{
                      id: data.id,
                      name: data.name,
                      brand: data.brand,
                      price: data.price,
                      currency: data.currency,
                      category: data.category.name,
                      inStock: data.inStock,
                      comingSoon: data.comingSoon,
                    }}
                  />
                  <WishlistButton
                    productId={data.id}
                    productName={data.name}
                    variant="inline"
                    className="size-14"
                  />
                </div>

                <Link
                  href={`/product/${data.slug}`}
                  className="eyebrow mt-5 inline-flex items-center gap-2 text-muted transition-colors hover:text-ink"
                >
                  Full details <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
