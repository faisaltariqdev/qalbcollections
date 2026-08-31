import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container, Eyebrow, GiltRule, Section } from "@/components/ui/primitives";
import { buildMetadata } from "@/lib/seo/metadata";

import { WishlistGrid } from "./wishlist-grid";

export const metadata: Metadata = buildMetadata({
  title: "Your wishlist",
  description: "The Qalb Collections pieces you have saved.",
  path: "/wishlist",
  noIndex: true,
});

export default function WishlistPage() {
  return (
    <>
      <Breadcrumbs crumbs={[{ name: "Wishlist", path: "/wishlist" }]} />
      <div className="border-b border-line bg-shell">
        <Container className="py-14 sm:py-16">
          <Eyebrow className="text-qalb">Saved</Eyebrow>
          <h1 className="mt-5 text-display-md text-ink">Your wishlist</h1>
          <GiltRule className="mt-7" />
          <p className="mt-6 max-w-lg text-sm leading-loose text-muted">
            Pieces worth returning to. Nothing here is reserved — stock moves, so tell us if
            something matters to you.
          </p>
        </Container>
      </div>
      <Section spacing="default">
        <Container>
          <WishlistGrid />
        </Container>
      </Section>
    </>
  );
}
