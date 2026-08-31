"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search as SearchIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Dialog, DialogTitle, SheetContent } from "@/components/ui/dialog";
import { Badge, Spinner } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { formatMoney } from "@/lib/money";
import { categoryPath } from "@/lib/routes";
import type { SearchSuggestions } from "@/server/search";

const QUICK_LINKS = [
  { label: "Automatic", href: "/watches?attr_movement=Automatic" },
  { label: "Under Rs 15,000", href: "/watches?price_max=15000" },
  { label: "Steel bracelet", href: "/watches?attr_strap-material=Steel+bracelet" },
  { label: "Black dial", href: "/watches?attr_dial-colour=Black" },
  { label: "Gift guide", href: "/gift-guide" },
];

const EMPTY: SearchSuggestions = {
  term: "",
  products: [],
  brands: [],
  categories: [],
  collections: [],
  didYouMean: null,
  total: 0,
};

/**
 * Predictive search.
 *
 * Requests are debounced and the in-flight one is aborted when the query
 * changes, so a fast typist never sees results for a prefix they have already
 * moved past.
 */
export function SearchDialog({ triggerClassName }: { triggerClassName?: string }) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SearchSuggestions>(EMPTY);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const router = useRouter();

  const query = term.trim();
  const searchable = query.length >= 2;
  // Derived rather than cleared in an effect, so a shortened query never shows
  // results for the longer one it came from.
  const suggestions = searchable ? results : EMPTY;

  useEffect(() => {
    if (!open || !searchable) {
      abortRef.current?.abort();
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as SearchSuggestions;
        setResults(data);
        track("product_search", { term: query, results: data.total });
      } catch {
        // Aborted or offline.
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query, open, searchable]);

  useEffect(() => {
    // Cmd/Ctrl-K is the expected shortcut and costs one listener.
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const submit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const query = term.trim();
      if (query.length < 2) return;
      track("search_used", { term: query, source: "header" });
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(query)}`);
    },
    [router, term],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex size-11 items-center justify-center transition-opacity hover:opacity-70",
          triggerClassName,
        )}
        aria-label="Search"
      >
        <SearchIcon className="size-[18px]" strokeWidth={1.5} />
      </button>

      <SheetContent side="top" className="max-h-[92dvh]" showClose={false}>
        <DialogTitle className="sr-only">Search Qalb Collections</DialogTitle>

        <form onSubmit={submit} className="border-b border-line">
          <div className="shell-x mx-auto flex max-w-[88rem] items-center gap-4 py-5">
            <SearchIcon className="size-5 shrink-0 text-muted" strokeWidth={1.5} />
            <input
              // The dialog exists to receive this input; focusing it is expected.
              autoFocus
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Search by brand, model or reference"
              aria-label="Search products"
              className="min-w-0 flex-1 bg-transparent font-display text-2xl text-ink outline-none placeholder:text-faint sm:text-3xl"
            />
            {loading ? <Spinner className="text-muted" /> : null}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="eyebrow shrink-0 text-muted transition-colors hover:text-ink"
            >
              Close
            </button>
          </div>
        </form>

        <div className="scrollbar-slim overflow-y-auto">
          <div className="shell-x mx-auto max-w-[88rem] py-8">
            {!searchable ? (
              <div>
                <p className="eyebrow text-muted">Popular</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {QUICK_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="border border-line px-4 py-2 text-sm text-ink-soft transition-colors hover:border-ink hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : suggestions.total === 0 && !loading ? (
              <div className="max-w-xl">
                <h3 className="font-display text-2xl text-ink">
                  Nothing matches &ldquo;{suggestions.term}&rdquo;
                </h3>
                {suggestions.didYouMean ? (
                  <p className="mt-3 text-sm text-muted">
                    Did you mean{" "}
                    <button
                      type="button"
                      className="text-ink underline decoration-line underline-offset-4"
                      onClick={() => setTerm(suggestions.didYouMean!)}
                    >
                      {suggestions.didYouMean}
                    </button>
                    ?
                  </p>
                ) : null}
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  Try a brand, a movement type, or tell us what the watch is for.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {QUICK_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="border border-line px-4 py-2 text-sm text-ink-soft transition-colors hover:border-ink hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid gap-10 lg:grid-cols-[1fr_16rem]">
                <div>
                  <p className="eyebrow text-muted">Products</p>
                  <ul className="mt-4 divide-y divide-line-soft">
                    {suggestions.products.map((hit) => (
                      <li key={hit.id}>
                        <Link
                          href={`/product/${hit.slug}`}
                          onClick={() => setOpen(false)}
                          className="group flex items-center gap-4 py-3 transition-colors hover:bg-shell/60"
                        >
                          <div className="relative size-16 shrink-0 overflow-hidden bg-shell">
                            {hit.imageUrl ? (
                              <Image
                                src={hit.imageUrl}
                                alt={hit.imageAlt}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="eyebrow text-[0.5625rem] text-muted">{hit.brand}</p>
                            <p className="truncate text-sm text-ink">{hit.name}</p>
                            <p className="mt-0.5 text-xs text-muted" data-numeric>
                              {formatMoney(hit.price, hit.currency)}
                            </p>
                          </div>
                          {hit.comingSoon ? (
                            <Badge tone="gilt">Coming soon</Badge>
                          ) : !hit.inStock ? (
                            <Badge tone="neutral">Sold out</Badge>
                          ) : null}
                          <ArrowRight className="size-4 shrink-0 -translate-x-1 text-muted opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={submit}
                    className="eyebrow mt-6 inline-flex items-center gap-2 text-ink"
                  >
                    See all results <ArrowRight className="size-3.5" />
                  </button>
                </div>

                <div className="space-y-8">
                  {suggestions.brands.length > 0 ? (
                    <div>
                      <p className="eyebrow text-muted">Brands</p>
                      <ul className="mt-3 space-y-1">
                        {suggestions.brands.map((brand) => (
                          <li key={brand.name}>
                            <Link
                              href={`/watches?brand=${encodeURIComponent(brand.name)}`}
                              onClick={() => setOpen(false)}
                              className="flex items-center justify-between text-sm text-ink-soft transition-colors hover:text-ink"
                            >
                              <span>{brand.name}</span>
                              <span className="text-xs text-faint" data-numeric>
                                {brand.count}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {suggestions.categories.length > 0 ? (
                    <div>
                      <p className="eyebrow text-muted">Categories</p>
                      <ul className="mt-3 space-y-1">
                        {suggestions.categories.map((category) => (
                          <li key={category.slug}>
                            <Link
                              href={categoryPath(category.slug)}
                              onClick={() => setOpen(false)}
                              className="text-sm text-ink-soft transition-colors hover:text-ink"
                            >
                              {category.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {suggestions.collections.length > 0 ? (
                    <div>
                      <p className="eyebrow text-muted">Collections</p>
                      <ul className="mt-3 space-y-1">
                        {suggestions.collections.map((collection) => (
                          <li key={collection.slug}>
                            <Link
                              href={`/collection/${collection.slug}`}
                              onClick={() => setOpen(false)}
                              className="text-sm text-ink-soft transition-colors hover:text-ink"
                            >
                              {collection.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Dialog>
  );
}
