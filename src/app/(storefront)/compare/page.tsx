import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container, Eyebrow, GiltRule, Section } from "@/components/ui/primitives";
import { buildMetadata } from "@/lib/seo/metadata";

import { CompareTable } from "./compare-table";

export const metadata: Metadata = buildMetadata({
  title: "Compare pieces",
  description:
    "Place up to four Qalb Collections timepieces side by side and compare movement, case, strap and price.",
  path: "/compare",
  // The selection is personal to the visitor, so there is nothing here to index.
  noIndex: true,
});

export default function ComparePage() {
  return (
    <>
      <Breadcrumbs crumbs={[{ name: "Compare", path: "/compare" }]} />

      <header className="border-b border-line bg-shell">
        <Container className="py-14 sm:py-16">
          <Eyebrow className="text-qalb">Side by side</Eyebrow>
          <h1 className="mt-5 text-display-lg text-ink">Compare</h1>
          <GiltRule className="mt-7" />
          <p className="mt-7 max-w-xl text-base leading-relaxed text-muted">
            The differences that matter are rarely in the photographs. Line the pieces up and read
            the movement, the case and the strap against each other.
          </p>
        </Container>
      </header>

      <Section spacing="default">
        <Container>
          <CompareTable />
        </Container>
      </Section>
    </>
  );
}
