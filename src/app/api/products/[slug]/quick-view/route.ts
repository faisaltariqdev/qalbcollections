import { NextResponse } from "next/server";

import { getProductBySlug } from "@/server/catalog";

/**
 * Compact product payload for quick view.
 *
 * Listing pages stay light because this is fetched only when a shopper actually
 * opens the panel, rather than embedded in every card.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      id: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      sku: product.sku,
      shortDescription: product.shortDescription,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      currency: product.currency,
      images: product.images.slice(0, 4),
      inStock: product.inStock,
      lowStock: product.lowStock,
      comingSoon: product.comingSoon,
      stock: product.stock,
      category: product.category,
      badges: product.badges,
      // The handful of specs a shopper decides on, not the full table.
      highlights: product.specifications.slice(0, 6),
    },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
