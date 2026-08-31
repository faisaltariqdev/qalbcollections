"use client";

import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Dialog, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { Select } from "@/components/ui/field";
import { track } from "@/lib/analytics";
import { setSortHref, type RawSearchParams } from "@/lib/product-query";
import { SORT_OPTIONS } from "@/server/catalog-types";

/**
 * Sort control and the mobile entry point to filters.
 *
 * Sorting is a native `<select>` — the platform picker on a phone beats any
 * custom listbox, and it is keyboard- and screen-reader-correct for free.
 */
export function ListingToolbar({
  basePath,
  searchParams,
  currentSort,
  total,
  activeFilterCount,
  filterRail,
}: {
  basePath: string;
  searchParams: RawSearchParams;
  currentSort: string;
  total: number;
  activeFilterCount: number;
  filterRail: ReactNode;
}) {
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="flex items-center justify-between gap-4 border-y border-line py-3.5">
      <div className="flex items-center gap-4">
        <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-ink lg:hidden"
          >
            <SlidersHorizontal className="size-3.5" />
            Filter
            {activeFilterCount > 0 ? (
              <span
                className="flex size-4 items-center justify-center bg-ink text-[0.5625rem] leading-none text-canvas"
                data-numeric
              >
                {activeFilterCount}
              </span>
            ) : null}
          </button>

          <SheetContent side="left" className="w-[min(22rem,calc(100vw-2.5rem))]">
            <DialogTitle className="border-b border-line px-6 py-5 font-display text-xl">
              Refine
            </DialogTitle>
            <div className="scrollbar-slim flex-1 overflow-y-auto px-6 py-6">{filterRail}</div>
            <div className="border-t border-line px-6 py-4">
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="eyebrow w-full bg-ink py-3.5 text-canvas"
              >
                Show {total} {total === 1 ? "result" : "results"}
              </button>
            </div>
          </SheetContent>
        </Dialog>

        <p className="text-sm text-dust" data-numeric>
          <span className="text-ink">{total}</span> {total === 1 ? "piece" : "pieces"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="listing-sort" className="text-sm font-medium text-dust hidden sm:block">
          Sort
        </label>
        <Select
          id="listing-sort"
          value={currentSort}
          onChange={(event) => {
            track("filter_used", { facet: "sort", value: event.target.value });
            router.push(setSortHref(basePath, searchParams, event.target.value), {
              scroll: false,
            });
          }}
          className="h-10 w-auto min-w-40 border-0 bg-transparent py-0 pl-0 pr-8 text-sm font-medium text-ink hover:border-0 focus:border-0"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
