import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { Price } from "@/components/product/price";
import { QuickView } from "@/components/product/quick-view";
import { WishlistButton } from "@/components/product/wishlist-button";
import { Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "@/server/catalog-types";

/**
 * Atelier product card.
 *
 * Hero poster on a wine panel; hover crossfades to the detail photograph of
 * the same piece. Gold outline, serif name, and a full-width gold Add to Bag.
 */
export function ProductCard({
  product,
  priority = false,
  size = "default",
  className,
}: {
  product: ProductCardData;
  priority?: boolean;
  size?: "default" | "compact" | "editorial";
  className?: string;
}) {
  const { primaryImage, secondaryImage } = product;
  const unavailable = !product.inStock && !product.comingSoon;

  return (
    <article
      className={cn(
        "group/card card-luxury relative flex h-full flex-col overflow-hidden border border-champ/25 bg-void text-warm-white shadow-lift transition-all duration-500 ease-[var(--ease-luxe)] hover:-translate-y-1.5 hover:border-champ/70 hover:shadow-[var(--shadow-gold)]",
        className,
      )}
    >
      <div className="relative bg-void">
        <Link
          href={`/product/${product.slug}`}
          className="block focus-visible:outline-offset-4"
          aria-label={`${product.brand} ${product.name}`}
        >
          <div className="relative aspect-3/4 w-full overflow-hidden bg-void">
            {primaryImage ? (
              <>
                <Image
                  src={primaryImage.url}
                  alt={primaryImage.alt}
                  fill
                  priority={priority}
                  loading={priority ? undefined : "lazy"}
                  quality={90}
                  sizes={
                    size === "compact"
                      ? "(max-width: 640px) 50vw, 240px"
                      : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  }
                  className={cn(
                    "object-contain object-center transition-opacity duration-700 ease-[var(--ease-luxe)]",
                    secondaryImage && "group-hover/card:opacity-0",
                    unavailable && "opacity-60",
                  )}
                />
                {secondaryImage ? (
                  <Image
                    src={secondaryImage.url}
                    alt={secondaryImage.alt}
                    fill
                    loading="lazy"
                    quality={90}
                    sizes={
                      size === "compact"
                        ? "(max-width: 640px) 50vw, 240px"
                        : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    }
                    className="object-contain object-center opacity-0 transition-opacity duration-700 ease-[var(--ease-luxe)] group-hover/card:opacity-100"
                  />
                ) : null}
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="eyebrow text-champ">{product.brand}</span>
              </div>
            )}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-void/80 to-transparent opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
            />
          </div>
        </Link>

        {product.badges.length > 0 ? (
          <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1">
            {product.badges.map((badge) => (
              <Badge key={badge.label} tone={badge.tone}>
                {badge.label}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="absolute right-3 top-3 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100">
          <WishlistButton productId={product.id} productName={product.name} />
        </div>

        {secondaryImage ? (
          <span className="pointer-events-none absolute bottom-3 left-3 eyebrow text-[0.4375rem] tracking-[0.22em] text-champ opacity-0 transition-opacity duration-500 group-hover/card:opacity-100">
            Detail view
          </span>
        ) : null}
      </div>

      <div
        className={cn(
          "flex flex-1 flex-col px-4 pb-5",
          size === "compact" ? "pt-3.5" : "pt-4",
        )}
      >
        <p className="eyebrow tracking-[0.18em] text-champ">{product.brand}</p>

        <h3
          className={cn(
            "mt-2 line-clamp-2 min-h-[2.4em] font-display font-medium leading-snug text-warm-white",
            size === "compact" ? "text-[1.125rem]" : "text-[1.3125rem]",
          )}
        >
          <Link href={`/product/${product.slug}`} className="transition-colors hover:text-champ">
            {product.name}
          </Link>
        </h3>

        <div className="mt-3 flex items-center justify-between gap-3">
          <Price
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            currency={product.currency}
            size={size === "compact" ? "sm" : "md"}
            className="[&>span]:text-warm-white"
          />
          {product.comingSoon ? (
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-champ">Soon</span>
          ) : product.lowStock ? (
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-warning">Low stock</span>
          ) : null}
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-4">
          {unavailable ? (
            <span className="block py-2.5 text-center text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-ash">
              Sold out
            </span>
          ) : (
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
              size="sm"
              variant="secondary"
              block
            />
          )}
          <QuickView slug={product.slug} productId={product.id} />
        </div>
      </div>
    </article>
  );
}

/** Responsive product grid — never one column, always minimum two. */
export function ProductGrid({
  products,
  columns = 4,
  priorityCount = 0,
  size = "default",
  className,
}: {
  products: ProductCardData[];
  columns?: 2 | 3 | 4;
  priorityCount?: number;
  size?: "default" | "compact" | "editorial";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid items-stretch gap-x-5 gap-y-8 sm:gap-x-6 sm:gap-y-10",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-2 md:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          size={size}
          priority={index < priorityCount}
        />
      ))}
    </div>
  );
}

/**
 * Slim horizontal product bar for dark editorial sections.
 */
export function SignatureProductBar({
  product,
  className,
}: {
  product: ProductCardData;
  className?: string;
}) {
  const image = product.primaryImage;

  return (
    <div
      className={cn(
        "flex items-center gap-4 border border-champ/35 bg-void-soft/60 p-2.5 pr-3 sm:gap-5",
        className,
      )}
    >
      <Link
        href={`/product/${product.slug}`}
        className="relative block size-14 shrink-0 overflow-hidden bg-wine sm:size-16"
        aria-label={`${product.brand} ${product.name}`}
      >
        {image ? (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            loading="lazy"
            quality={85}
            sizes="64px"
            className="object-cover"
          />
        ) : null}
      </Link>

      <div className="min-w-0 flex-1">
        <p className="eyebrow text-[0.4375rem] tracking-[0.24em] text-champ-soft/70">
          {product.brand}
        </p>
        <Link
          href={`/product/${product.slug}`}
          className="link-sweep mt-1 block truncate font-display text-[1rem] font-light leading-tight text-warm-white"
        >
          {product.name}
        </Link>
      </div>

      <Price
        price={product.price}
        compareAtPrice={product.compareAtPrice}
        currency={product.currency}
        size="sm"
        className="hidden shrink-0 sm:inline-flex [&>span]:text-warm-white"
      />

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
        size="sm"
        variant="inverse"
        block={false}
        className="shrink-0"
      />
    </div>
  );
}

/** Homepage commerce card with visible Add to Bag. */
export function ProductCommerceCard({
  product,
  priority = false,
  className,
}: {
  product: ProductCardData;
  priority?: boolean;
  className?: string;
}) {
  return <ProductCard product={product} priority={priority} className={className} />;
}
