import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ProductCard } from "@/components/product/product-card";
import { Reveal } from "@/components/ui/reveal";
import { ChampagneLine, Container, Section, SectionHeading } from "@/components/ui/primitives";
import type { ProductCardData } from "@/server/catalog-types";

/**
 * Editorial product rail.
 *
 * Curated product row for Featured, New Arrivals, Bestsellers.
 * Heading left, "View all" right. Clean ivory background.
 * The section heading line is followed by a champagne rule.
 */
export function ProductRail({
  eyebrow,
  title,
  body,
  ctaLabel,
  ctaHref,
  products,
  tone = "cream",
  columns = 4,
}: {
  eyebrow?: string | null;
  title: string;
  body?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  products: ProductCardData[];
  tone?: "cream" | "ivory" | "shell" | "canvas"; // shell/canvas = legacy aliases
  columns?: 3 | 4;
}) {
  if (products.length === 0) return null;

  return (
    <Section tone={tone as "cream" | "ivory"}>
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={eyebrow ?? undefined}
            title={title}
            description={body ?? undefined}
            action={
              ctaHref && ctaLabel ? (
                <Link
                  href={ctaHref}
                  className="link-sweep eyebrow inline-flex items-center gap-3 text-ink tracking-[0.2em]"
                >
                  {ctaLabel}
                  <ArrowRight className="size-3" />
                </Link>
              ) : undefined
            }
          />
          <ChampagneLine className="mt-8 w-20" />
        </Reveal>

        <Reveal delay={80} className="mt-16">
          {products.length >= 3 ? (
            <div className="grid gap-8 lg:grid-cols-[1.08fr_1fr] lg:gap-10">
              <ProductCard product={products[0]} priority size="editorial" />
              <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:gap-x-8">
                {products.slice(1, columns).map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    priority={index < 1}
                    size="default"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-14 sm:gap-x-8">
              {products.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  priority={index === 0}
                  size="default"
                />
              ))}
            </div>
          )}
        </Reveal>
      </Container>
    </Section>
  );
}
