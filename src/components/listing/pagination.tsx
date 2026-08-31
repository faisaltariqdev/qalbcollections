import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { setPageHref, type RawSearchParams } from "@/lib/product-query";
import { cn } from "@/lib/utils";

/**
 * Link-based pagination.
 *
 * Real anchors rather than infinite scroll, so every page of inventory is
 * crawlable, linkable and reachable by keyboard — and a shopper can leave and
 * come back to the same place.
 */
export function Pagination({
  basePath,
  searchParams,
  page,
  pageCount,
}: {
  basePath: string;
  searchParams: RawSearchParams;
  page: number;
  pageCount: number;
}) {
  if (pageCount <= 1) return null;

  const windowSize = 2;
  const pages: (number | "gap")[] = [];

  for (let candidate = 1; candidate <= pageCount; candidate += 1) {
    const nearCurrent = Math.abs(candidate - page) <= windowSize;
    const isEdge = candidate === 1 || candidate === pageCount;
    if (nearCurrent || isEdge) {
      pages.push(candidate);
    } else if (pages.at(-1) !== "gap") {
      pages.push("gap");
    }
  }

  const cellClass =
    "flex size-10 items-center justify-center border text-sm transition-colors";

  return (
    <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link
          href={setPageHref(basePath, searchParams, page - 1)}
          rel="prev"
          aria-label="Previous page"
          className={cn(cellClass, "border-line text-ink hover:border-ink")}
        >
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span aria-hidden className={cn(cellClass, "border-line-soft text-faint")}>
          <ChevronLeft className="size-4" />
        </span>
      )}

      {pages.map((entry, index) =>
        entry === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-sm text-faint" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={entry}
            href={setPageHref(basePath, searchParams, entry)}
            aria-label={`Page ${entry}`}
            aria-current={entry === page ? "page" : undefined}
            data-numeric
            className={cn(
              cellClass,
              entry === page
                ? "border-ink bg-ink text-canvas"
                : "border-line text-ink hover:border-ink",
            )}
          >
            {entry}
          </Link>
        ),
      )}

      {page < pageCount ? (
        <Link
          href={setPageHref(basePath, searchParams, page + 1)}
          rel="next"
          aria-label="Next page"
          className={cn(cellClass, "border-line text-ink hover:border-ink")}
        >
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span aria-hidden className={cn(cellClass, "border-line-soft text-faint")}>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
