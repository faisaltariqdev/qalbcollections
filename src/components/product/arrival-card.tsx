import Image from "next/image";
import Link from "next/link";

import { formatMoney } from "@/lib/money";
import type { ProductCardData } from "@/server/catalog-types";

/**
 * Lookbook card for the arrivals rail.
 *
 * The full poster — logo included — is shown. Hover crossfades to the detail shot.
 */
export function ArrivalCard({ product }: { product: ProductCardData }) {
  const image = product.primaryImage;
  const detail = product.secondaryImage;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group card-luxury flex h-full min-w-[16rem] max-w-[16rem] flex-col overflow-hidden border border-champ/25 bg-void sm:min-w-[18.5rem] sm:max-w-[18.5rem]"
      aria-label={`${product.brand} ${product.name}`}
    >
      <div className="relative aspect-3/4 overflow-hidden bg-void">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt}
            fill
            loading="lazy"
            quality={88}
            sizes="18.5rem"
            className={
              detail
                ? "object-contain object-center transition-opacity duration-700 ease-[var(--ease-luxe)] group-hover:opacity-0"
                : "object-contain object-center"
            }
          />
        ) : null}
        {detail ? (
          <Image
            src={detail.url}
            alt={detail.alt}
            fill
            loading="lazy"
            quality={88}
            sizes="18.5rem"
            className="object-contain object-center opacity-0 transition-opacity duration-700 ease-[var(--ease-luxe)] group-hover:opacity-100"
          />
        ) : null}
      </div>

      <div className="px-4 py-4">
        <p className="eyebrow tracking-[0.16em] text-champ">{product.brand}</p>
        <h3 className="mt-1.5 font-display text-[1.1875rem] font-medium leading-snug text-warm-white transition-colors duration-300 group-hover:text-champ">
          {product.name}
        </h3>
        <p className="mt-2 text-sm text-warm-white" data-numeric>
          {formatMoney(product.price, product.currency)}
        </p>
      </div>
    </Link>
  );
}
