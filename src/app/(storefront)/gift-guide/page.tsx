import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Gift } from "lucide-react";

import { TrackEvent } from "@/components/analytics/track-event";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductGrid } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import {
  Container,
  EmptyState,
  Eyebrow,
  GiltRule,
  Section,
  SectionHeading,
} from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";
import type { RawSearchParams } from "@/lib/product-query";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteSettings, whatsappLink } from "@/lib/settings";
import { listProducts, listTags } from "@/server/catalog";

/**
 * Gift guide.
 *
 * Recipients and occasions are tags, not hard-coded routes, so a future
 * occasion — or a future category's gifting angle — is a row in the database.
 * Selecting one lands on a real filtered listing rather than a dead-end page.
 */

export const revalidate = 600;

export const metadata: Metadata = buildMetadata({
  title: "Gift guide",
  description:
    "Choose by who it is for or what the occasion is, and see the Qalb Collections pieces that suit. Boxed, protected and delivered ready to give.",
  path: "/gift-guide",
});

export default async function GiftGuidePage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const selected = (Array.isArray(params.tag) ? params.tag[0] : params.tag) ?? null;

  const [audiences, occasions, settings] = await Promise.all([
    listTags("audience"),
    listTags("occasion"),
    getSiteSettings(),
  ]);

  const activeTag =
    [...audiences, ...occasions].find((tag) => tag.slug === selected) ?? null;

  const { products, total } = activeTag
    ? await listProducts({
        categorySlug: undefined,
        tagSlugs: [activeTag.slug],
        includeComingSoon: false,
        perPage: 9,
        sort: "featured",
      })
    : { products: [], total: 0 };

  const whatsapp = whatsappLink(
    settings.whatsappNumber,
    "Hello Qalb Collections — I need help choosing a gift.",
  );

  return (
    <>
      <Breadcrumbs crumbs={[{ name: "Gift guide", path: "/gift-guide" }]} />

      <header className="border-b border-line bg-shell">
        <Container className="py-16 sm:py-20">
          <div className="max-w-2xl">
            <Eyebrow className="text-qalb">Gifting</Eyebrow>
            <h1 className="mt-5 text-display-lg text-ink">Find the perfect gift</h1>
            <GiltRule className="mt-7" />
            <p className="mt-7 text-base leading-relaxed text-muted">
              A watch is one of the few gifts that gets worn every day and dated by the year it was
              given. Start with the person, or start with the occasion.
            </p>
          </div>
        </Container>
      </header>

      <Section spacing="default">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <TagGroup title="Who is it for?" tags={audiences} selected={selected} />
              <TagGroup
                className="mt-12"
                title="What is the occasion?"
                tags={occasions}
                selected={selected}
              />

              <div className="mt-12 border-t border-line pt-8">
                <p className="text-sm leading-relaxed text-muted">
                  Still deciding? Tell us who it is for and what they wear, and we will send two or
                  three options.
                </p>
                <Button asChild variant="secondary" size="sm" className="mt-5">
                  <Link href={whatsapp ?? "/contact"} {...(whatsapp ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                    Ask for a recommendation
                  </Link>
                </Button>
              </div>
            </div>

            <div>
              {activeTag ? (
                <>
                  <SectionHeading
                    eyebrow={`${total} ${total === 1 ? "suggestion" : "suggestions"}`}
                    title={activeTag.label}
                    description="Chosen for the occasion, not padded out to fill a grid."
                  />

                  {products.length === 0 ? (
                    <EmptyState
                      className="mt-10"
                      icon={<Gift className="size-10" strokeWidth={1} />}
                      title="Nothing tagged for this yet"
                      description="The catalogue is small and honest — we would rather show you nothing than pretend. Browse everything, or ask us."
                      actions={
                        <>
                          <Button asChild variant="primary">
                            <Link href="/watches">Browse all watches</Link>
                          </Button>
                          <Button asChild variant="ghost">
                            <Link href="/contact">Ask us</Link>
                          </Button>
                        </>
                      }
                    />
                  ) : (
                    <div className="mt-10">
                      <ProductGrid products={products} columns={3} priorityCount={3} />
                    </div>
                  )}

                  {total > products.length ? (
                    <div className="mt-12 border-t border-line pt-8">
                      <Link
                        href={`/shop?tag=${activeTag.slug}`}
                        className="eyebrow inline-flex items-center gap-2 text-ink"
                      >
                        See all {total} <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  ) : null}

                  <TrackEvent
                    name="gift_guide_completed"
                    payload={{ occasion: activeTag.slug, results: total }}
                  />
                </>
              ) : (
                <>
                  <SectionHeading
                    eyebrow="How it works"
                    title="Start on the left"
                    description="Pick a recipient or an occasion and the suggestions appear here. Everything ships boxed, with the warranty paperwork where one applies."
                  />

                  <div className="mt-12 grid gap-6 sm:grid-cols-2">
                    {[
                      {
                        title: "Boxed to give",
                        body: "Every piece leaves us in its own box, protected for transit. Nothing arrives loose in a mailer.",
                      },
                      {
                        title: "No price on the paperwork",
                        body: "Ask us to leave the invoice out of the parcel and we will send it to you separately.",
                      },
                      {
                        title: `${settings.returnsWindowDays}-day returns`,
                        body: "If the size or style is wrong, it can come back unworn within the window, complete with its box.",
                      },
                      {
                        title: "We will help you choose",
                        body: "Tell us what they already wear. A short conversation beats guessing at a specification.",
                      },
                    ].map((item, index) => (
                      <Reveal key={item.title} delay={index * 70}>
                        <div className="border-t border-line pt-6">
                          <h3 className="font-display text-xl text-ink">{item.title}</h3>
                          <p className="mt-3 text-sm leading-relaxed text-muted">{item.body}</p>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

function TagGroup({
  title,
  tags,
  selected,
  className,
}: {
  title: string;
  tags: { slug: string; label: string }[];
  selected: string | null;
  className?: string;
}) {
  if (tags.length === 0) return null;

  return (
    <div className={className}>
      <h2 className="eyebrow border-b border-line pb-3 text-ink">{title}</h2>
      <ul className="mt-4 space-y-1">
        {tags.map((tag) => {
          const active = tag.slug === selected;
          return (
            <li key={tag.slug}>
              <Link
                href={active ? "/gift-guide" : `/gift-guide?tag=${tag.slug}`}
                aria-current={active ? "true" : undefined}
                className={`flex items-center justify-between gap-3 py-2.5 text-sm transition-colors ${
                  active ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                <span className={active ? "border-b border-ink pb-0.5" : undefined}>
                  {tag.label}
                </span>
                {active ? null : <ArrowRight className="size-3.5 text-faint" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
