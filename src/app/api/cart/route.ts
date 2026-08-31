import { NextResponse } from "next/server";

import { getCartSummary } from "@/server/cart";

export const dynamic = "force-dynamic";

/**
 * Cart badge summary.
 *
 * Reading the count from the client keeps the server-rendered page shell free
 * of per-visitor state, so storefront pages stay cacheable while the header
 * still reflects the visitor's own bag.
 */
export async function GET() {
  const summary = await getCartSummary();
  return NextResponse.json(summary, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
