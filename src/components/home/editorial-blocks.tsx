import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { EmailCapture } from "@/components/marketing/email-capture";
import { Button } from "@/components/ui/button";
import {
  ChampagneLine,
  Container,
  Eyebrow,
  Section,
  SectionHeading,
} from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";
import { formatDate } from "@/lib/utils";

/* ============================================================
   StatementBlock
   Full-width split: large headline left, editorial copy right.
   ============================================================ */
export function StatementBlock({
  eyebrow,
  title,
  body,
  ctaLabel,
  ctaHref,
}: {
  eyebrow?: string | null;
  title: string;
  body?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
}) {
  return (
    <Section tone="cream">
      <Container>
        <Reveal className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:gap-32">
          <div>
            {eyebrow ? (
              <Eyebrow className="flex items-center gap-4 text-ash">
                <span aria-hidden className="block h-px w-8 bg-ash/40" />
                {eyebrow}
              </Eyebrow>
            ) : null}
            <h2 className="mt-6 text-display-lg text-ink">{title}</h2>
            <ChampagneLine className="mt-10 w-24" />
          </div>
          <div className="flex flex-col justify-center">
            {body
              ? body.split("\n\n").map((p, i) => (
                  <p key={i} className="mb-6 text-[1.0625rem] leading-[1.9] text-dust last:mb-0">
                    {p}
                  </p>
                ))
              : null}
            {ctaHref && ctaLabel ? (
              <Link
                href={ctaHref}
                className="link-sweep eyebrow mt-8 inline-flex items-center gap-3 text-ink tracking-[0.2em]"
              >
                {ctaLabel}
                <ArrowRight className="size-3" />
              </Link>
            ) : null}
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

/* ============================================================
   DetailStoryBlock
   Large cinematic image left, editorial copy right.
   ============================================================ */
export function DetailStoryBlock({
  eyebrow,
  title,
  body,
  ctaLabel,
  ctaHref,
  imageUrl,
  imageAlt,
}: {
  eyebrow?: string | null;
  title: string;
  body?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  imageUrl: string;
  imageAlt: string;
}) {
  return (
    <Section tone="ivory" spacing="none">
      <div className="grid items-stretch lg:grid-cols-2">
        <div className="relative aspect-4/5 w-full overflow-hidden lg:aspect-auto lg:min-h-[44rem]">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            loading="lazy"
            quality={92}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>

        <div className="flex items-center px-8 py-24 sm:px-14 lg:px-20 xl:px-28">
          <Reveal className="max-w-md">
            {eyebrow ? (
              <Eyebrow className="flex items-center gap-4 text-ash">
                <span aria-hidden className="block h-px w-8 bg-ash/40" />
                {eyebrow}
              </Eyebrow>
            ) : null}
            <h2 className="mt-6 text-display-md text-ink">{title}</h2>
            <ChampagneLine className="mt-8 w-20" />
            {body
              ? body.split("\n\n").map((p, i) => (
                  <p key={i} className="mt-7 text-[1rem] leading-[1.9] text-dust">
                    {p}
                  </p>
                ))
              : null}
            {ctaHref && ctaLabel ? (
              <Button asChild variant="secondary" className="mt-12">
                <Link href={ctaHref}>{ctaLabel}</Link>
              </Button>
            ) : null}
          </Reveal>
        </div>
      </div>
    </Section>
  );
}

/* ============================================================
   CollectionShowcase
   Editorial grid: collections as large portrait tiles.
   ============================================================ */
export function CollectionShowcase({
  eyebrow,
  title,
  body,
  collections,
}: {
  eyebrow?: string | null;
  title: string;
  body?: string | null;
  collections: {
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    count: number;
  }[];
}) {
  if (collections.length === 0) return null;

  return (
    <Section tone="cream">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={eyebrow ?? undefined}
            title={title}
            description={body ?? undefined}
            action={
              <Link
                href="/collections"
                className="link-sweep eyebrow inline-flex items-center gap-3 text-ink tracking-[0.2em]"
              >
                All collections <ArrowRight className="size-3" />
              </Link>
            }
          />
        </Reveal>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection, i) => (
            <Reveal key={collection.slug} delay={i * 80}>
              <Link href={`/collection/${collection.slug}`} className="group block">
                <div className="relative aspect-3/4 overflow-hidden bg-ivory">
                  {collection.imageUrl ? (
                    <Image
                      src={collection.imageUrl}
                      alt={collection.name}
                      fill
                      loading="lazy"
                      quality={92}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-[1500ms] ease-[var(--ease-luxe)] group-hover:scale-[1.04]"
                    />
                  ) : null}
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-void/82 via-void/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-8">
                    <p className="eyebrow text-[0.5rem] text-champ-soft tracking-[0.24em]" data-numeric>
                      {collection.count} {collection.count === 1 ? "piece" : "pieces"}
                    </p>
                    <h3 className="mt-3 font-display text-[1.5rem] font-light leading-tight text-warm-white">
                      {collection.name}
                    </h3>
                    {collection.description ? (
                      <p className="mt-2 line-clamp-2 text-[0.8125rem] leading-relaxed text-warm-white/55">
                        {collection.description}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}

/* ============================================================
   TrustBlock
   Dark section with numbered editorial trust points.
   ============================================================ */
export function TrustBlock({
  eyebrow,
  title,
  points,
}: {
  eyebrow?: string | null;
  title: string;
  points: { title: string; body: string }[];
}) {
  return (
    <Section tone="void">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={eyebrow ?? undefined}
            title={title}
            tone="dark"
            align="center"
          />
        </Reveal>

        {/* Champagne divider */}
        <div aria-hidden className="mt-16 h-px rule-champ opacity-20" />

        <dl className="mt-16 grid gap-x-16 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {points.map((point, i) => (
            <Reveal key={point.title} delay={i * 70}>
              <div className="flex gap-7">
                {/* Ornamental number */}
                <span
                  aria-hidden
                  className="shrink-0 font-display text-[2.75rem] leading-none text-champ/25 tabular-nums"
                  style={{ letterSpacing: "-0.04em" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="pt-1.5">
                  <dt className="font-display text-[1.25rem] font-light leading-snug text-warm-white">
                    {point.title}
                  </dt>
                  <dd className="mt-3 text-[0.875rem] leading-relaxed text-warm-white/45">
                    {point.body}
                  </dd>
                </div>
              </div>
            </Reveal>
          ))}
        </dl>
      </Container>
    </Section>
  );
}

/* ============================================================
   JournalBlock
   Magazine editorial layout: 1 large feature + 2 smaller.
   ============================================================ */
export function JournalBlock({
  eyebrow,
  title,
  body,
  posts,
}: {
  eyebrow?: string | null;
  title: string;
  body?: string | null;
  posts: {
    title: string;
    slug: string;
    excerpt: string;
    category: string;
    readMinutes: number;
    coverImage: string | null;
    coverAlt: string | null;
    publishedAt: Date | null;
  }[];
}) {
  if (posts.length === 0) return null;

  const [feature, ...rest] = posts.slice(0, 3);

  return (
    <Section tone="cream">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow={eyebrow ?? undefined}
            title={title}
            description={body ?? undefined}
            action={
              <Link
                href="/journal"
                className="link-sweep eyebrow inline-flex items-center gap-3 text-ink tracking-[0.2em]"
              >
                All articles <ArrowRight className="size-3" />
              </Link>
            }
          />
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Feature story — large */}
          {feature ? (
            <Reveal>
              <Link href={`/journal/${feature.slug}`} className="group block">
                <div className="relative aspect-4/3 overflow-hidden bg-ivory lg:aspect-[4/3]">
                  {feature.coverImage ? (
                    <Image
                      src={feature.coverImage}
                      alt={feature.coverAlt ?? feature.title}
                      fill
                      loading="lazy"
                      quality={92}
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      className="object-cover transition-transform duration-[1500ms] ease-[var(--ease-luxe)] group-hover:scale-[1.04]"
                    />
                  ) : null}
                </div>
                <div className="mt-6">
                  <div className="flex items-center gap-3 text-[0.5625rem] uppercase tracking-[0.22em] text-ash">
                    <span className="text-ink">{feature.category}</span>
                    <span aria-hidden className="text-champ/50">◆</span>
                    <span data-numeric>{feature.readMinutes} min read</span>
                  </div>
                  <h3 className="mt-3 font-display text-[1.75rem] font-light leading-snug text-ink">
                    <span className="link-sweep">{feature.title}</span>
                  </h3>
                  <p className="mt-3 line-clamp-2 text-[0.9375rem] leading-relaxed text-dust">
                    {feature.excerpt}
                  </p>
                </div>
              </Link>
            </Reveal>
          ) : null}

          {/* Smaller stories */}
          <div className="flex flex-col gap-6">
            {rest.map((post, i) => (
              <Reveal key={post.slug} delay={i * 80}>
                <Link href={`/journal/${post.slug}`} className="group flex gap-5">
                  {post.coverImage ? (
                    <div className="relative aspect-square w-28 shrink-0 overflow-hidden bg-ivory">
                      <Image
                        src={post.coverImage}
                        alt={post.coverAlt ?? post.title}
                        fill
                        loading="lazy"
                        quality={85}
                        sizes="112px"
                        className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-luxe)] group-hover:scale-[1.05]"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2.5 text-[0.5rem] uppercase tracking-[0.22em] text-ash">
                      <span className="text-ink/70">{post.category}</span>
                      <span aria-hidden className="text-champ/40">◆</span>
                      <span data-numeric>{post.readMinutes} min</span>
                    </div>
                    <h3 className="mt-2 font-display text-[1.125rem] font-light leading-snug text-ink">
                      <span className="link-sweep">{post.title}</span>
                    </h3>
                    {post.publishedAt ? (
                      <p className="mt-2 text-xs text-ash">{formatDate(post.publishedAt)}</p>
                    ) : null}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}

/* ============================================================
   NewsletterBlock
   Centered on ivory. Large headline, single input.
   ============================================================ */
export function NewsletterBlock({
  eyebrow,
  title,
  body,
}: {
  eyebrow?: string | null;
  title: string;
  body?: string | null;
}) {
  return (
    <Section tone="ivory" spacing="tight">
      <Container size="narrow" className="text-center">
        <Reveal>
          {eyebrow ? <Eyebrow className="text-ash">{eyebrow}</Eyebrow> : null}
          <h2 className="mt-6 text-display-md text-ink">{title}</h2>
          <ChampagneLine className="mx-auto mt-8 w-16" />
          {body ? (
            <p className="mx-auto mt-7 max-w-md text-[0.9375rem] leading-relaxed text-dust">
              {body}
            </p>
          ) : null}
          <div className="mx-auto mt-12 max-w-md">
            <EmailCapture source="homepage" ctaLabel="Subscribe" />
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

/* ============================================================
   ComingSoonBlock
   "The Next Chapter" — cinematic dark perfume teaser.
   ============================================================ */
export function ComingSoonBlock({
  eyebrow,
  title,
  body,
  ctaLabel,
  ctaHref,
  note,
}: {
  eyebrow?: string | null;
  title: string;
  body?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  note: string;
}) {
  return (
    <Section tone="void">
      <Container>
        <Reveal className="grid items-center gap-20 lg:grid-cols-2 lg:gap-32">
          <div>
            {eyebrow ? (
              <Eyebrow className="flex items-center gap-4 text-champ-soft/60 tracking-[0.28em]">
                <span aria-hidden className="block h-px w-8 bg-champ/30" />
                {eyebrow}
              </Eyebrow>
            ) : null}
            <h2 className="mt-7 text-display-lg text-warm-white">{title}</h2>
            <ChampagneLine className="mt-10 w-20" />
            {body ? (
              <p className="mt-9 max-w-md text-[1.0625rem] leading-loose text-warm-white/50">
                {body}
              </p>
            ) : null}
            {ctaHref && ctaLabel ? (
              <Button asChild variant="inverseOutline" className="mt-12">
                <Link href={ctaHref}>{ctaLabel}</Link>
              </Button>
            ) : null}
          </div>

          {/* Notify panel with champagne corner accents */}
          <div className="relative border border-warm-white/10 p-10 sm:p-14">
            {/* Corner accents */}
            <span aria-hidden className="absolute left-0 top-0 h-8 w-px bg-champ/40" />
            <span aria-hidden className="absolute left-0 top-0 h-px w-8 bg-champ/40" />
            <span aria-hidden className="absolute bottom-0 right-0 h-8 w-px bg-champ/40" />
            <span aria-hidden className="absolute bottom-0 right-0 h-px w-8 bg-champ/40" />

            <p className="eyebrow text-warm-white/35 tracking-[0.22em]">Be told first</p>
            <p className="mt-5 font-display text-[1.5rem] font-light leading-snug text-warm-white/85">
              {note}
            </p>
            <EmailCapture
              className="mt-10"
              intent="notify"
              topic="perfumes"
              tone="dark"
              ctaLabel="Notify me"
              placeholder="Your email address"
              note="One message when Qalb Perfumes launches."
            />
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
