import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductListing } from "@/components/listing/product-listing";
import { EmailCapture } from "@/components/marketing/email-capture";
import { JsonLdGraph } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { Container, Eyebrow, GiltRule, Section } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";
import type { RawSearchParams } from "@/lib/product-query";
import { buildMetadata } from "@/lib/seo/metadata";
import { collectionPageSchema } from "@/lib/seo/structured-data";
import { getSiteSettings } from "@/lib/settings";
import { getCategoryBySlug, listComparison, listProducts } from "@/server/catalog";
import { buildListing } from "@/server/listing-page";

/**
 * Perfumes.
 *
 * The same route serves two states. While the category is COMING_SOON this is an
 * editorial waiting page; the moment an editor sets it ACTIVE, the products that
 * already exist in the database render as a normal listing. Launching is a
 * status change, not a deployment.
 */

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const category = await getCategoryBySlug("perfumes");
  if (!category) return { title: "Perfumes" };

  return buildMetadata({
    title: category.seoTitle ?? "Qalb Perfumes",
    description:
      category.seoDescription ??
      category.description ??
      "Qalb Perfumes — three compositions in development.",
    path: "/perfumes",
  });
}

export default async function PerfumesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const category = await getCategoryBySlug("perfumes");
  if (!category || category.status === "HIDDEN") notFound();

  const params = await searchParams;

  if (category.status === "ACTIVE") {
    const listing = await buildListing({
      searchParams: params,
      overrides: { categorySlug: "perfumes" },
    });

    return (
      <>
        <Breadcrumbs
          crumbs={[
            { name: "Shop", path: "/shop" },
            { name: "Perfumes", path: "/perfumes" },
          ]}
        />
        <ProductListing
          eyebrow="Qalb Perfumes"
          title={category.name}
          description={category.description}
          editorialIntro={category.editorialIntro}
          basePath="/perfumes"
          searchParams={params}
          products={listing.products}
          facets={listing.facets}
          total={listing.total}
          page={listing.page}
          pageCount={listing.pageCount}
          sort={listing.sort}
          currency={listing.currency}
        />
        <JsonLdGraph
          items={[
            collectionPageSchema({
              name: category.name,
              description: category.description ?? "Qalb Perfumes.",
              path: "/perfumes",
              items: listing.products.map((product) => ({
                name: product.name,
                slug: product.slug,
                brand: product.brand,
                image: product.primaryImage?.url ?? null,
              })),
            }),
          ]}
        />
      </>
    );
  }

  // --- Coming soon ---------------------------------------------------------

  const [settings, { products }] = await Promise.all([
    getSiteSettings(),
    listProducts({ categorySlug: "perfumes", perPage: 6 }),
  ]);
  const compositions = await listComparison(products.map((product) => product.id));

  return (
    <>
      <Breadcrumbs crumbs={[{ name: "Perfumes", path: "/perfumes" }]} />

      {/* Typographic rather than photographic: there is no product photography
          yet, and inventing some would be a lie. */}
      <section className="bg-obsidian text-canvas">
        <Container className="py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            <Eyebrow className="text-gilt">Next from Qalb</Eyebrow>
            <h1 className="mt-7 font-display text-[clamp(2.75rem,7vw,5.5rem)] font-light leading-[0.95] tracking-[-0.02em]">
              The scent of
              <br />
              what&rsquo;s next
            </h1>
            <GiltRule className="mt-9 w-24" />
            <p className="mt-9 max-w-xl text-base leading-loose text-canvas/70">
              {category.editorialIntro ?? settings.perfumesLaunchNote}
            </p>

            <div className="mt-12 max-w-md">
              <p className="eyebrow text-canvas/50">Be told first</p>
              <EmailCapture
                intent="notify"
                topic="perfumes"
                source="perfumes-page"
                tone="dark"
                ctaLabel="Notify me"
                placeholder="Your email address"
                label="Email address for the perfume launch list"
                note="One message when the first composition is ready. Nothing else."
                className="mt-4"
              />
            </div>
          </div>
        </Container>
      </section>

      {compositions.length > 0 ? (
        <Section spacing="default">
          <Container>
            <div className="max-w-2xl">
              <Eyebrow className="text-qalb">In development</Eyebrow>
              <h2 className="mt-5 text-display-md text-ink">The first three</h2>
              <GiltRule className="mt-7" />
              <p className="mt-7 text-base leading-relaxed text-muted">
                Composition notes below are current, not final. They will change before release, and
                we would rather show you the work in progress than a finished promise we have not
                earned.
              </p>
            </div>

            <div className="mt-16 divide-y divide-line border-y border-line">
              {compositions.map((composition, index) => (
                <Reveal key={composition.id} delay={index * 90}>
                  <article className="grid gap-8 py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
                    <div>
                      <p className="eyebrow text-faint" data-numeric>
                        No.{index + 1}
                      </p>
                      <h3 className="mt-4 font-display text-3xl leading-tight text-ink">
                        {composition.name}
                      </h3>
                      {composition.shortDescription ? (
                        <p className="mt-5 text-sm leading-loose text-muted">
                          {composition.shortDescription}
                        </p>
                      ) : null}
                    </div>

                    <dl className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
                      {composition.specifications.map((row) => (
                        <div key={row.key} className="border-t border-line-soft pt-3">
                          <dt className="eyebrow text-[0.5625rem] text-faint">{row.label}</dt>
                          <dd className="mt-1.5 text-sm text-ink">{row.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </article>
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      <Section tone="shell" spacing="tight">
        <Container size="narrow" className="text-center">
          <h2 className="text-display-sm text-ink">Until then, the watches</h2>
          <p className="mt-5 text-sm leading-relaxed text-muted">
            The catalogue is small on purpose. Every piece is chosen, photographed and described by
            the same people who will answer your questions about it.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild variant="primary" size="lg">
              <Link href="/watches">Explore watches</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/about">Discover Qalb</Link>
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
