import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  Container,
  Eyebrow,
  GiltRule,
  Section,
  EmptyState,
} from "@/components/ui/primitives";
import { JsonLd } from "@/components/seo/json-ld";
import { Reveal } from "@/components/ui/reveal";
import { buildMetadata } from "@/lib/seo/metadata";
import { indexPageSchema } from "@/lib/seo/structured-data";
import { listCollections } from "@/server/catalog";

export const revalidate = 600;

export const metadata: Metadata = buildMetadata({
  title: "Collections",
  description:
    "Curated edits from Qalb Collections — The Signature Edit, The Dress Code and Everyday Essentials.",
  path: "/collections",
});

export default async function CollectionsPage() {
  const collections = await listCollections();

  return (
    <>
      <Breadcrumbs crumbs={[{ name: "Collections", path: "/collections" }]} />

      <header className="border-b border-line bg-shell">
        <Container className="py-16 sm:py-20">
          <div className="max-w-2xl">
            <Eyebrow className="text-qalb">Edits</Eyebrow>
            <h1 className="mt-5 text-display-lg text-ink">Collections</h1>
            <GiltRule className="mt-7" />
            <p className="mt-7 text-base leading-relaxed text-muted">
              Three ways into the same catalogue. Each edit answers a different question — what to
              wear to the thing that matters, what to wear the rest of the time, and what to buy if
              you are only buying one.
            </p>
          </div>
        </Container>
      </header>

      <Section spacing="default">
        <Container>
          {collections.length === 0 ? (
            <EmptyState
              title="No collections yet"
              description="Edits are being put together. Browse the full catalogue in the meantime."
            />
          ) : (
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {collections.map((collection, index) => (
                <Reveal key={collection.slug} delay={index * 80}>
                  <Link href={`/collection/${collection.slug}`} className="group block">
                    <div className="relative aspect-4/5 overflow-hidden bg-shell">
                      {collection.imageUrl ? (
                        <Image
                          src={collection.imageUrl}
                          alt={collection.name}
                          fill
                              quality={90}
                          priority={index === 0}
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-luxe)] group-hover:scale-[1.04]"
                        />
                      ) : null}
                      <div
                        aria-hidden
                        className="absolute inset-0 bg-gradient-to-t from-obsidian/70 via-transparent to-transparent"
                      />
                    </div>

                    <div className="mt-6">
                      <p className="eyebrow text-[0.5625rem] text-muted" data-numeric>
                        {collection._count.products}{" "}
                        {collection._count.products === 1 ? "piece" : "pieces"}
                      </p>
                      <h2 className="mt-2 font-display text-2xl text-ink">
                        <span className="link-sweep">{collection.name}</span>
                      </h2>
                      {collection.description ? (
                        <p className="mt-3 text-sm leading-relaxed text-muted">
                          {collection.description}
                        </p>
                      ) : null}
                      <span className="eyebrow mt-5 inline-flex items-center gap-2 text-ink">
                        View the edit <ArrowRight className="size-3.5" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </Container>
      </Section>
      <JsonLd
        data={indexPageSchema({
          name: "Collections",
          description: "Curated edits from the Qalb Collections catalogue.",
          path: "/collections",
          items: collections.map((collection) => ({
            name: collection.name,
            path: `/collection/${collection.slug}`,
          })),
        })}
      />
    </>
  );
}
