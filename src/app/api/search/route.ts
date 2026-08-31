import { NextResponse, type NextRequest } from "next/server";

import { limitByClient } from "@/lib/rate-limit";
import { getSearchSuggestions } from "@/server/search";

export const dynamic = "force-dynamic";

/** Predictive search for the header. Rate limited so it cannot be scraped. */
export async function GET(request: NextRequest) {
  const term = request.nextUrl.searchParams.get("q")?.slice(0, 120) ?? "";

  if (term.trim().length < 2) {
    return NextResponse.json({
      term,
      products: [],
      brands: [],
      categories: [],
      collections: [],
      didYouMean: null,
      total: 0,
    });
  }

  const limit = await limitByClient("search", 60, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many searches. Please slow down." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const suggestions = await getSearchSuggestions(term);

  return NextResponse.json(suggestions, {
    headers: { "Cache-Control": "private, max-age=20" },
  });
}
