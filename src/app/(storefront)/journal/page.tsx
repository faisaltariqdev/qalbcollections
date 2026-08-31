import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container, EmptyState, Eyebrow, GiltRule, Section } from "@/components/ui/primitives";
import { JsonLd } from "@/components/seo/json-ld";
import { Reveal } from "@/components/ui/reveal";
import { buildMetadata } from "@/lib/seo/metadata";
import { indexPageSchema } from "@/lib/seo/structured-data";
import { formatDate } from "@/lib/utils";
import { listJournalCategories, listJournalPosts } from "@/server/content";

/**
 * Qalb Journal index.
 *
 * The lead article gets the editorial treatment; the rest form a quiet grid.
 * Categories filter by query parameter so every view is linkable.
 */

export const revalidate = 900;

export const metadata: Metadata = buildMetadata({
  title: "Qalb Journal",
  description:
    "Buying guides, care guides and honest arguments about wearing a watch — written by the people who sell them.",
  path: "/journal",
});

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [posts, categories] = await Promise.all([listJournalPosts(), listJournalCategories()]);

  const filtered = category ? posts.filter((post) => post.category === category) : posts;
  const [lead, ...rest] = filtered;

  return (
    <>
      <Breadcrumbs crumbs={[{ name: "Journal", path: "/journal" }]} />

      <header className="border-b border-line bg-shell">
        <Container className="py-16 sm:py-20">
          <div className="max-w-2xl">
            <Eyebrow className="text-qalb">Qalb Journal</Eyebrow>
            <h1 className="mt-5 text-display-lg text-ink">Writing about time</h1>
            <GiltRule className="mt-7" />
            <p className="mt-7 text-base leading-relaxed text-muted">
              Guides we wish had existed when we started buying watches: what the specifications
              actually mean, what they cost you in practice, and what to ignore.
            </p>
          </div>

          {categories.length > 1 ? (
            <nav aria-label="Journal categories" className="mt-10 flex flex-wrap gap-2">
              <CategoryChip label="Everything" href="/journal" active={!category} />
              {categories.map((entry) => (
                <CategoryChip
                  key={entry.name}
                  label={entry.name}
                  href={`/journal?category=${encodeURIComponent(entry.name)}`}
                  active={category === entry.name}
                />
              ))}
            </nav>
          ) : null}
        </Container>
      </header>

      <Section spacing="default">
        <Container>
          {!lead ? (
            <EmptyState
              title="Nothing published here yet"
              description="New guides are being written. Try another category."
            />
          ) : (
            <>
              {/* Lead article */}
              <Reveal>
                <Link
                  href={`/journal/${lead.slug}`}
                  className="group grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:gap-16"
                >
                  <div className="relative aspect-16/10 overflow-hidden bg-shell">
                    {lead.coverImage ? (
                      <Image
                        src={lead.coverImage}
                        alt={lead.coverAlt ?? lead.title}
                        fill
                        priority
                        quality={90}
                        sizes="(max-width: 1024px) 100vw, 55vw"
                        className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-luxe)] group-hover:scale-[1.03]"
                      />
                    ) : null}
                  </div>

                  <div>
                    <p className="eyebrow text-qalb">{lead.category}</p>
                    <h2 className="mt-5 font-display text-3xl leading-[1.15] text-ink sm:text-4xl">
                      <span className="link-sweep">{lead.title}</span>
                    </h2>
                    <p className="mt-5 text-base leading-relaxed text-muted">{lead.excerpt}</p>
                    <p className="mt-6 text-xs text-faint" data-numeric>
                      {lead.publishedAt ? formatDate(lead.publishedAt) : "Draft"} ·{" "}
                      {lead.readMinutes} min read
                    </p>
                    <span className="eyebrow mt-7 inline-flex items-center gap-2 text-ink">
                      Read the guide <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </Link>
              </Reveal>

              {rest.length > 0 ? (
                <div className="mt-20 grid gap-x-8 gap-y-14 border-t border-line pt-16 md:grid-cols-2 xl:grid-cols-3">
                  {rest.map((post, index) => (
                    <Reveal key={post.slug} delay={index * 70}>
                      <article>
                        <Link href={`/journal/${post.slug}`} className="group block">
                          <div className="relative aspect-4/3 overflow-hidden bg-shell">
                            {post.coverImage ? (
                              <Image
                                src={post.coverImage}
                                alt={post.coverAlt ?? post.title}
                                fill
                                quality={90}
                                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                                className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-luxe)] group-hover:scale-[1.04]"
                              />
                            ) : null}
                          </div>
                          <p className="eyebrow mt-6 text-[0.5625rem] text-qalb">{post.category}</p>
                          <h3 className="mt-3 font-display text-xl leading-snug text-ink">
                            <span className="link-sweep">{post.title}</span>
                          </h3>
                          <p className="mt-3 text-sm leading-relaxed text-muted">{post.excerpt}</p>
                          <p className="mt-4 text-xs text-faint" data-numeric>
                            {post.readMinutes} min read
                          </p>
                        </Link>
                      </article>
                    </Reveal>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </Container>
      </Section>
      <JsonLd
        data={indexPageSchema({
          name: "Qalb Journal",
          description:
            "Buying guides, care guides and product stories from Qalb Collections.",
          path: "/journal",
          items: filtered.map((post) => ({
            name: post.title,
            path: `/journal/${post.slug}`,
          })),
        })}
      />
    </>
  );
}

function CategoryChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`eyebrow border px-3.5 py-2 text-[0.5625rem] transition-colors ${
        active ? "border-ink bg-ink text-canvas" : "border-line text-muted hover:border-ink hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}
