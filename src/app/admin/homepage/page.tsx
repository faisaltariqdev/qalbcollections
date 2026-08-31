import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { HomepageEditor } from "@/components/admin/homepage-editor";
import { PageHeader, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

/** What each homepage block actually renders, so an editor knows what they are switching off. */
const SECTION_NOTES: Record<string, string> = {
  "art-of-time": "A full-width statement, no products.",
  featured: "A rail of products flagged as featured.",
  "signature-collection": "Cards for the collections marked as featured.",
  "watch-finder": "Entry point to Find Your Timepiece, using the style tags.",
  "new-arrivals": "A rail of products flagged as new arrivals.",
  "editorial-story": "Image-and-text block about craft and detail.",
  bestsellers: "A rail of products flagged as bestsellers.",
  "perfumes-coming-soon": "Teaser for the perfumes launch, with the notify form.",
  "why-qalb": "The trust promises. Only claims you can substantiate belong here.",
  "gift-guide": "Entry point to the gift guide, using the occasion tags.",
  journal: "The three most recent published journal pieces.",
  newsletter: "Email capture.",
};

export default async function AdminHomepagePage() {
  await requireAdminPage("content.write");

  const [sections, hero] = await Promise.all([
    db.homeSection.findMany({ orderBy: { sortOrder: "asc" } }),
    db.banner.findFirst({
      where: { placement: "home_hero", active: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Homepage"
        description="The order and copy of every block on the homepage. What each block shows is fixed; what it says, and whether it appears at all, is not."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/" prefetch={false} target="_blank">
              View homepage
              <ExternalLink className="size-3.5" />
            </Link>
          </Button>
        }
      />

      <Panel
        className="mb-6"
        title="Hero"
        description="The cinematic block above everything else."
        actions={
          <Button asChild variant="secondary" size="sm">
            <Link href="/admin/homepage/hero">Edit hero</Link>
          </Button>
        }
      >
        {hero ? (
          <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
            <Detail label="Eyebrow" value={hero.eyebrow} />
            <Detail label="Headline" value={hero.title} />
            <Detail label="Subheadline" value={hero.subtitle} />
            <Detail label="Primary link" value={hero.ctaLabel ? `${hero.ctaLabel} → ${hero.ctaHref}` : null} />
            <Detail label="Secondary link" value={hero.ctaLabel2 ? `${hero.ctaLabel2} → ${hero.ctaHref2}` : null} />
            <Detail label="Last edited" value={formatDate(hero.updatedAt)} />
          </dl>
        ) : (
          <p className="text-sm text-muted">
            No hero is set, so the homepage starts at the first section below.
          </p>
        )}
      </Panel>

      <HomepageEditor
        descriptions={SECTION_NOTES}
        sections={sections.map((section) => ({
          id: section.id,
          key: section.key,
          eyebrow: section.eyebrow ?? "",
          title: section.title ?? "",
          body: section.body ?? "",
          ctaLabel: section.ctaLabel ?? "",
          ctaHref: section.ctaHref ?? "",
          sortOrder: String(section.sortOrder),
          enabled: section.enabled,
        }))}
      />
    </>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="eyebrow text-[0.5rem] text-faint">{label}</dt>
      <dd className="mt-1 text-ink-soft">{value || "—"}</dd>
    </div>
  );
}
