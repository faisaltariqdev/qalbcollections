import { NextResponse, type NextRequest } from "next/server";

import { MAX_COMPARE_ITEMS } from "@/lib/constants";
import { listComparison } from "@/server/catalog";

/** Hydrates the browser-held comparison selection into cards plus specifications. */
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, MAX_COMPARE_ITEMS);

  if (ids.length === 0) return NextResponse.json([]);

  return NextResponse.json(await listComparison(ids), {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
