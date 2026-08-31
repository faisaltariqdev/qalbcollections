import { NextResponse, type NextRequest } from "next/server";

import { listProductsByIds } from "@/server/catalog";

/**
 * Hydrates browser-held id lists — recently viewed, guest wishlist, the compare
 * tray — into full product cards. Capped so the endpoint cannot be used to dump
 * the catalogue in one request.
 */
const MAX_IDS = 12;

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("ids") ?? "";
  const ids = raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, MAX_IDS);

  if (ids.length === 0) return NextResponse.json([]);

  const products = await listProductsByIds(ids);

  return NextResponse.json(products, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
