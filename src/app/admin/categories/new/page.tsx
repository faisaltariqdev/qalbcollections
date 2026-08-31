import { TaxonomyForm } from "@/components/admin/taxonomy-form";
import { PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth/guards";
import { BLANK_TAXONOMY } from "@/lib/admin/taxonomy-defaults";
import { db } from "@/lib/db";

export default async function NewCategoryPage() {
  await requireAdminPage("category.write");
  const parents = await db.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <>
      <PageHeader
        breadcrumb={{ label: "Categories", href: "/admin/categories" }}
        title="New category"
        description="Create the category first, then declare the specifications its products should carry."
      />
      <TaxonomyForm kind="category" initial={BLANK_TAXONOMY} parents={parents} />
    </>
  );
}
