import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductGrid } from "@/components/product/product-card";
import { JsonLdGraph } from "@/components/seo/json-ld";
import { Container, Divider, Eyebrow, GiltRule, Section } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";
import { db } from "@/lib/db";
import { Markdown } from "@/lib/markdown";
import { buildMetadata } from "@/lib/seo/metadata";
import { articleSchema } from "@/lib/seo/structured-data";
import { formatDate } from "@/lib/utils";
import { listCurated } from "@/server/catalog";
import { getJournalPost, getRelatedPosts } from "@/server/content";

/**
 * Journal article.
 *
 * A single measured column, because that is what long-form reading wants. The
 * catalogue appears once at the end — the article earns the visit, the products
 * are the invitation, not the interruption.
 */

export const revalidate = 900;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const posts = await db.blogPost.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true },
  });
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getJournalPost(slug);
  if (!post) return { title: "Article not found" };

  return buildMetadata({
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    path: `/journal/${post.slug}`,
    canonicalPath: post.canonicalUrl ?? undefined,
    image: post.ogImageUrl ?? post.coverImage,
    imageAlt: post.coverAlt ?? post.title,
    noIndex: post.noIndex,
    type: "article",
    publishedTime: post.publishedAt?.toISOString(),
    modifiedTime: post.updatedAt.toISOString(),
  });
}

export default async function JournalPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await getJournalPost(slug);
  if (!post) notFound();

  const [related, products] = await Promise.all([
    getRelatedPosts(post.slug, post.category),
    listCurated("featured", 3),
  ]);

  return (
    <>
      <Breadcrumbs
        crumbs={[
          { name: "Journal", path: "/journal" },
          { name: post.title, path: `/journal/${post.slug}` },
        ]}
      />

      <article>
        <Container size="narrow" className="pb-12 pt-4 sm:pt-8">
          <header>
            <Eyebrow className="text-qalb">{post.category}</Eyebrow>
            <h1 className="mt-5 font-display text-[clamp(2rem,5vw,3.5rem)] font-light leading-[1.08] tracking-[-0.015em] text-ink">
              {post.title}
            </h1>
            <GiltRule className="mt-8" />
            <p className="mt-8 text-lg leading-relaxed text-muted">{post.excerpt}</p>
            <p className="mt-8 text-xs text-faint" data-numeric>
              {post.authorName} · {post.publishedAt ? formatDate(post.publishedAt) : "Unpublished"} ·{" "}
              {post.readMinutes} min read
            </p>
          </header>
        </Container>

        {post.coverImage ? (
          <Container>
            <div className="relative aspect-16/9 overflow-hidden bg-shell sm:aspect-21/9">
              <Image
                src={post.coverImage}
                alt={post.coverAlt ?? post.title}
                fill
                priority
                quality={90}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </Container>
        ) : null}

        <Container size="narrow" className="py-16 sm:py-20">
          <Markdown content={post.body} className="prose-qalb text-[1.0625rem]" />

          <Divider className="mt-16" />
          <footer className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-faint">
              Written by {post.authorName}. Last reviewed {formatDate(post.updatedAt)}.
            </p>
            <Link href="/journal" className="eyebrow inline-flex items-center gap-2 text-ink">
              More from the Journal <ArrowRight className="size-3.5" />
            </Link>
          </footer>
        </Container>
      </article>

      {related.length > 0 ? (
        <Section tone="shell" spacing="tight">
          <Container>
            <h2 className="text-display-sm text-ink">Keep reading</h2>
            <div className="mt-10 grid gap-x-8 gap-y-12 md:grid-cols-3">
              {related.map((entry, index) => (
                <Reveal key={entry.slug} delay={index * 70}>
                  <Link href={`/journal/${entry.slug}`} className="group block">
                    <div className="relative aspect-4/3 overflow-hidden bg-shell-deep">
                      {entry.coverImage ? (
                        <Image
                          src={entry.coverImage}
                          alt={entry.coverAlt ?? entry.title}
                          fill
                          quality={75}
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-luxe)] group-hover:scale-[1.04]"
                        />
                      ) : null}
                    </div>
                    <p className="eyebrow mt-5 text-[0.5625rem] text-qalb">{entry.category}</p>
                    <h3 className="mt-3 font-display text-lg leading-snug text-ink">
                      <span className="link-sweep">{entry.title}</span>
                    </h3>
                  </Link>
                </Reveal>
              ))}
            </div>
          </Container>
        </Section>
      ) : null}

      {products.length > 0 ? (
        <Section spacing="tight">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <Eyebrow className="text-qalb">From the catalogue</Eyebrow>
                <h2 className="mt-4 text-display-sm text-ink">Currently curated</h2>
              </div>
              <Link href="/watches" className="eyebrow inline-flex items-center gap-2 text-ink">
                All watches <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="mt-10">
              <ProductGrid products={products} columns={3} size="compact" />
            </div>
          </Container>
        </Section>
      ) : null}

      <JsonLdGraph
        items={[
          articleSchema({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            authorName: post.authorName,
            image: post.ogImageUrl ?? post.coverImage,
            publishedAt: post.publishedAt,
            updatedAt: post.updatedAt,
          }),
        ]}
      />
    </>
  );
}
