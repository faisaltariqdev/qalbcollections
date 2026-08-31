import { HeroForm } from "@/components/admin/hero-form";
import { PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";

export default async function AdminHeroPage() {
  await requireAdminPage("content.write");

  const hero = await db.banner.findFirst({
    where: { placement: "home_hero" },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <>
      <PageHeader
        breadcrumb={{ label: "Homepage", href: "/admin/homepage" }}
        title="Homepage hero"
        description="One image, one line, two ways in. Everything else on the homepage can wait."
      />
      <HeroForm
        initial={{
          id: hero?.id,
          eyebrow: hero?.eyebrow ?? "",
          title: hero?.title ?? "",
          subtitle: hero?.subtitle ?? "",
          imageUrl: hero?.imageUrl ?? "",
          imageAlt: hero?.imageAlt ?? "",
          ctaLabel: hero?.ctaLabel ?? "",
          ctaHref: hero?.ctaHref ?? "",
          ctaLabel2: hero?.ctaLabel2 ?? "",
          ctaHref2: hero?.ctaHref2 ?? "",
          active: hero?.active ?? true,
        }}
      />
    </>
  );
}
