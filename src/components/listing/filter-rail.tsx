import Link from "next/link";

import { formatMoney } from "@/lib/money";
import {
  clearFiltersHref,
  setPriceHref,
  toggleFacetHref,
  type RawSearchParams,
} from "@/lib/product-query";
import { cn } from "@/lib/utils";
import type { Facet } from "@/server/catalog-types";

/**
 * Filter rail.
 *
 * Every control is a link, so filtering works before JavaScript loads, each
 * combination has a shareable URL, and the browser back button behaves. Counts
 * come from the server and reflect the other active filters.
 */

/** Splits a price range into four readable brackets. */
function priceBrackets(min: number, max: number, currency: string) {
  const span = max - min;
  if (span <= 0) return [];

  const step = Math.ceil(span / 4 / 100_000) * 100_000 || Math.ceil(span / 4);
  const brackets: { label: string; min: number | null; max: number | null }[] = [];

  brackets.push({
    label: `Under ${formatMoney(min + step, currency)}`,
    min: null,
    max: min + step,
  });
  brackets.push({
    label: `${formatMoney(min + step, currency)} – ${formatMoney(min + step * 2, currency)}`,
    min: min + step,
    max: min + step * 2,
  });
  brackets.push({
    label: `${formatMoney(min + step * 2, currency)} – ${formatMoney(min + step * 3, currency)}`,
    min: min + step * 2,
    max: min + step * 3,
  });
  brackets.push({
    label: `Over ${formatMoney(min + step * 3, currency)}`,
    min: min + step * 3,
    max: null,
  });

  return brackets.filter((bracket) => (bracket.min ?? min) < max);
}

function FacetGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-line py-6 first:border-t-0 first:pt-0">
      <h3 className="eyebrow text-ink">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function CheckLink({
  href,
  label,
  count,
  selected,
}: {
  href: string;
  label: string;
  /** Null hides the count, used for price brackets where it has no meaning. */
  count: number | null;
  selected: boolean;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-pressed={selected}
      className="group flex min-h-9 items-center gap-3 text-sm text-ink-soft transition-colors hover:text-ink"
    >
      <span
        aria-hidden
        className={cn(
          "flex size-4 shrink-0 items-center justify-center border transition-colors",
          selected ? "border-ink bg-ink" : "border-line group-hover:border-muted",
        )}
      >
        {selected ? (
          <svg viewBox="0 0 10 8" className="size-2.5 fill-none stroke-canvas stroke-[1.8]">
            <path d="M1 4.2 3.5 6.8 9 1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      <span className="flex-1">{label}</span>
      {count !== null ? (
        <span className="text-sm text-dust" data-numeric>
          {count}
        </span>
      ) : null}
    </Link>
  );
}

export function FilterRail({
  facets,
  basePath,
  searchParams,
  currency,
  hasFilters,
}: {
  facets: Facet[];
  basePath: string;
  searchParams: RawSearchParams;
  currency: string;
  hasFilters: boolean;
}) {
  if (facets.length === 0) {
    return (
      <p className="text-sm text-muted">
        Filters appear here once there is more than one option to choose from.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h2 className="eyebrow text-muted">Refine</h2>
        {hasFilters ? (
          <Link
            href={clearFiltersHref(basePath, searchParams)}
            scroll={false}
            className="text-xs text-qalb underline decoration-qalb/40 underline-offset-4 hover:decoration-qalb"
          >
            Clear all
          </Link>
        ) : null}
      </div>

      <div className="mt-6">
        {facets.map((facet) => {
          if (facet.kind === "range" && facet.range) {
            const brackets = priceBrackets(facet.range.min, facet.range.max, currency);
            return (
              <FacetGroup key={facet.param} title={facet.label}>
                <ul className="space-y-0.5">
                  {brackets.map((bracket) => {
                    const selected =
                      facet.range!.selectedMin === bracket.min &&
                      facet.range!.selectedMax === bracket.max;
                    return (
                      <li key={bracket.label}>
                        <CheckLink
                          href={
                            selected
                              ? setPriceHref(basePath, searchParams, null, null, currency)
                              : setPriceHref(
                                  basePath,
                                  searchParams,
                                  bracket.min,
                                  bracket.max,
                                  currency,
                                )
                          }
                          label={bracket.label}
                          count={null}
                          selected={selected}
                        />
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 text-xs text-faint" data-numeric>
                  {formatMoney(facet.range.min, currency)} –{" "}
                  {formatMoney(facet.range.max, currency)} across the range
                </p>
              </FacetGroup>
            );
          }

          return (
            <FacetGroup key={facet.param} title={facet.label}>
              <ul className="space-y-0.5">
                {facet.options.map((option) => (
                  <li key={option.value}>
                    <CheckLink
                      href={toggleFacetHref(basePath, searchParams, facet.param, option.value)}
                      label={option.label}
                      count={option.count}
                      selected={option.selected}
                    />
                  </li>
                ))}
              </ul>
            </FacetGroup>
          );
        })}
      </div>
    </div>
  );
}
