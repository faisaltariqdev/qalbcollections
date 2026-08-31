import type { Metadata } from "next";

import { CategoryStrip } from "@/components/home/category-strip";
import { Hero } from "@/components/home/hero";
import { NewArrivals } from "@/components/home/new-arrivals";
import { TrustBar } from "@/components/home/trust-bar";
import { ProductGrid } from "@/components/product/product-card";
import { JsonLd } from "@/components/seo/json-ld";
import { Container, Eyebrow } from "@/components/ui/primitives";
import { absoluteUrl } from "@/lib/env";
import { BRAND } from "@/lib/seo/metadata";
import { getHomeData } from "@/server/home";

/**
 * Homepage — burgundy atelier lookbook.
 */

export const revalidate = 300;

export const metadata: Metadata = {
  title: `${BRAND} — Luxury Watches, Crafted in Detail`,
  description:
    "A curated house of premium timepieces. Automatic and quartz watches chosen for proportion, legibility and finishing — with warranty, honest descriptions and nationwide delivery.",
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    title: `${BRAND} — Luxury Watches, Crafted in Detail`,
    description:
      "A curated house of premium timepieces, chosen for proportion, legibility and finishing.",
    url: absoluteUrl("/"),
    type: "website",
  },
};

export default async function HomePage() {
  const data = await getHomeData();

  const curatedProducts = [
    ...data.newArrivals,
    ...data.featured,
    ...data.bestsellers,
  ].filter((product, index, products) => products.findIndex((item) => item.id === product.id) === index);
  const arrivals = curatedProducts.slice(0, 8);
  const featured = curatedProducts.slice(0, 8);

  return (
    <>
      <Hero />

      <CategoryStrip />

      {featured.length > 0 ? (
        <section className="bg-void py-16 sm:py-20">
          <Container>
            <div className="max-w-2xl">
              <Eyebrow className="text-champ">The collection</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(2rem,5vw,3.5rem)] font-normal leading-[0.95] text-warm-white">
                Timepieces, presented as they live.
              </h2>
              <div className="diamond-rule mt-6 max-w-[9rem]" aria-hidden>
                <span />
              </div>
              <p className="mt-5 max-w-xl text-[0.95rem] leading-relaxed text-warm-white/65">
                Hover a card to reveal the detail photograph — dial, clasp, case-back and box — then add the piece to your bag in one motion.
              </p>
            </div>
            <div className="mt-12">
              <ProductGrid products={featured} columns={4} priorityCount={4} />
            </div>
          </Container>
        </section>
      ) : null}

      <NewArrivals products={arrivals} />

      <TrustBar />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Featured timepieces",
          itemListElement: data.featured.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: `${product.brand} ${product.name}`,
            url: absoluteUrl(`/product/${product.slug}`),
          })),
        }}
      />
    </>
  );
}
