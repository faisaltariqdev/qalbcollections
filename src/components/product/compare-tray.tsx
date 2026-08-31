"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, X } from "lucide-react";

import { useCompare } from "@/hooks/use-compare";
import { MAX_COMPARE_ITEMS } from "@/lib/constants";

/**
 * Persistent comparison tray.
 *
 * Sits above the page once anything is selected so the shopper can keep
 * browsing, and hides itself on the comparison page where it would be noise.
 */
export function CompareTray() {
  const { count, clear, ready } = useCompare();
  const pathname = usePathname();

  if (!ready || count === 0 || pathname === "/compare") return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4">
      <div
        className="pointer-events-auto flex items-center gap-4 border border-line bg-canvas px-4 py-3 shadow-panel"
        role="status"
      >
        <p className="text-xs text-dust">
          <span className="font-medium text-ink" data-numeric>
            {count}
          </span>{" "}
          of {MAX_COMPARE_ITEMS} selected to compare
        </p>

        <Link
          href="/compare"
          className="eyebrow inline-flex items-center gap-2 bg-ink px-4 py-2.5 text-[0.5625rem] text-warm-white transition-colors hover:bg-champ hover:text-void"
        >
          Compare <ArrowRight className="size-3" />
        </Link>

        <button
          type="button"
          onClick={clear}
          aria-label="Clear comparison"
          className="flex size-8 items-center justify-center text-dust transition-colors hover:text-ink"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** Checkbox-style toggle shown on product pages and the comparison table. */
export function CompareToggle({
  productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  const { has, toggle, ready } = useCompare();
  const selected = ready && has(productId);

  return (
    <button
      type="button"
      onClick={() => toggle(productId)}
      aria-pressed={selected}
      className={
        className ??
        "eyebrow inline-flex items-center gap-2 text-[0.5625rem] text-muted transition-colors hover:text-ink"
      }
    >
      <span
        aria-hidden
        className={`flex size-4 items-center justify-center border transition-colors ${
          selected ? "border-ink bg-ink" : "border-line"
        }`}
      >
        {selected ? (
          <svg viewBox="0 0 10 8" className="size-2.5 fill-none stroke-canvas stroke-[1.8]">
            <path d="M1 4.2 3.5 6.8 9 1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      {selected ? "Added to compare" : "Compare"}
    </button>
  );
}
