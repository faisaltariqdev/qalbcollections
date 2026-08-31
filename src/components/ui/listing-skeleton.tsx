import { Container, Skeleton } from "@/components/ui/primitives";

/**
 * Listing loading state.
 *
 * Mirrors the shape of a listing page so the layout does not jump when content
 * arrives — a skeleton that lies about the layout is worse than none.
 *
 * Used by the `loading.tsx` of routes that always exist. It is deliberately
 * *not* placed on the storefront group: a loading boundary above a page commits
 * the HTTP response before the page can decide, which would turn every unknown
 * product, category or article into a soft 404.
 */
export function ListingSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>

      <div className="border-b border-line bg-shell">
        <Container className="py-16 sm:py-20">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-6 h-12 w-2/3 max-w-lg" />
          <Skeleton className="mt-7 h-px w-16" />
          <Skeleton className="mt-7 h-4 w-full max-w-2xl" />
          <Skeleton className="mt-3 h-4 w-3/4 max-w-xl" />
        </Container>
      </div>

      <Container className="py-10 lg:py-14">
        <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
          <div className="hidden space-y-8 lg:block">
            {[0, 1, 2].map((group) => (
              <div key={group}>
                <Skeleton className="h-3 w-20" />
                <div className="mt-4 space-y-2.5">
                  {[0, 1, 2, 3].map((row) => (
                    <Skeleton key={row} className="h-3.5 w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <Skeleton className="h-10 w-full" />
            <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((card) => (
                <div key={card}>
                  <Skeleton className="aspect-4/5 w-full" />
                  <Skeleton className="mt-5 h-3 w-16" />
                  <Skeleton className="mt-3 h-4 w-3/4" />
                  <Skeleton className="mt-3 h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
