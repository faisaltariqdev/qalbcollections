import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/primitives";
import { breadcrumbSchema, type Crumb } from "@/lib/seo/structured-data";

/**
 * Breadcrumbs, rendered as a real `<nav>` with an ordered list and paired with
 * matching `BreadcrumbList` structured data so the trail Google shows is the
 * trail the visitor sees.
 */
export function Breadcrumbs({
  crumbs,
  className,
}: {
  /** Excluding Home, which is prepended, and excluding the current page label. */
  crumbs: Crumb[];
  className?: string;
}) {
  const full: Crumb[] = [{ name: "Home", path: "/" }, ...crumbs];

  return (
    <>
      <nav aria-label="Breadcrumb" className={className}>
        <Container>
          <ol className="flex flex-wrap items-center gap-1.5 py-4 text-[0.8125rem] font-medium tracking-[0.04em] text-dust">
            {full.map((crumb, index) => {
              const isLast = index === full.length - 1;
              return (
                <li key={crumb.path} className="flex items-center gap-1.5">
                  {isLast ? (
                    <span aria-current="page" className="text-ink">
                      {crumb.name}
                    </span>
                  ) : (
                    <>
                      <Link href={crumb.path} className="transition-colors hover:text-ink">
                        {crumb.name}
                      </Link>
                      <ChevronRight className="size-3 text-line" aria-hidden />
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        </Container>
      </nav>

      <JsonLd data={breadcrumbSchema(full)} />
    </>
  );
}
