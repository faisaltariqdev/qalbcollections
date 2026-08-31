import { TaxonomyForm } from "@/components/admin/taxonomy-form";
import { PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth/guards";
import { BLANK_TAXONOMY } from "@/lib/admin/taxonomy-defaults";

export default async function NewCollectionPage() {
  await requireAdminPage("collection.write");

  return (
    <>
      <PageHeader
        breadcrumb={{ label: "Collections", href: "/admin/collections" }}
        title="New collection"
        description="Create the collection, then add products to it from each product's editor."
      />
      <TaxonomyForm kind="collection" initial={BLANK_TAXONOMY} />
    </>
  );
}
