import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container, Eyebrow, GiltRule, Section } from "@/components/ui/primitives";
import { Markdown, markdownToPlainText } from "@/lib/markdown";
import { buildMetadata } from "@/lib/seo/metadata";
import { formatDate, truncate } from "@/lib/utils";
import { getPageBySlug, listPageSlugs } from "@/server/content";

/**
 * CMS pages — policies, and anything else an editor publishes.
 *
 * Static routes take precedence over this segment, so `/watches` and friends are
 * unaffected. Only slugs that exist at build time resolve; everything else is a
 * clean 404 rather than a dynamic miss.
 */

export const revalidate = 3600;
export const dynamicParams = false;

type Params = Promise<{ pageSlug: string }>;

export async function generateStaticParams() {
  const pages = await listPageSlugs();
  return pages.map((page) => ({ pageSlug: page.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { pageSlug } = await params;
  const page = await getPageBySlug(pageSlug);
  if (!page) return { title: "Page not found" };

  return buildMetadata({
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? truncate(markdownToPlainText(page.body), 158),
    path: `/${page.slug}`,
    canonicalPath: page.canonicalUrl ?? undefined,
    noIndex: page.noIndex,
  });
}

export default async function CmsPage({ params }: { params: Params }) {
  const { pageSlug } = await params;
  const page = await getPageBySlug(pageSlug);
  if (!page) notFound();

  return (
    <>
      <Breadcrumbs crumbs={[{ name: page.title, path: `/${page.slug}` }]} />

      <Section spacing="default">
        <Container size="narrow">
          <article>
            <header>
              <Eyebrow className="text-qalb">Qalb Collections</Eyebrow>
              <h1 className="mt-5 text-display-lg text-ink">{page.title}</h1>
              <GiltRule className="mt-7" />
              <p className="mt-6 text-xs text-faint">
                Last updated {formatDate(page.updatedAt)}
              </p>
            </header>

            <Markdown content={page.body} className="prose-qalb mt-12" />
          </article>
        </Container>
      </Section>
    </>
  );
}
