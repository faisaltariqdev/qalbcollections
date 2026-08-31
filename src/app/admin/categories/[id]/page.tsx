import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { AttributeEditor } from "@/components/admin/attribute-editor";
import { PageHeader } from "@/components/admin/ui";
import { TaxonomyForm } from "@/components/admin/taxonomy-form";
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth/guards";
import { toTaxonomyValues } from "@/lib/admin/taxonomy-defaults";
import { db } from "@/lib/db";
import { categoryPath } from "@/lib/routes";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage("category.write");
  const { id } = await params;

  const [category, parents] = await Promise.all([
    db.category.findUnique({
      where: { id },
      include: {
        attributes: {
          orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
          include: { _count: { select: { values: true } } },
        },
        _count: { select: { products: true } },
      },
    }),
    db.category.findMany({
      where: { parentId: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!category) notFound();

  return (
    <>
      <PageHeader
        breadcrumb={{ label: "Categories", href: "/admin/categories" }}
        title={category.name}
        description={`${category._count.products} product(s) · ${category.attributes.length} specification(s) declared`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={categoryPath(category.slug)} prefetch={false} target="_blank">
              View on site
              <ExternalLink className="size-3.5" />
            </Link>
          </Button>
        }
      />

      <div className="mb-6">
        <AttributeEditor
          categoryId={category.id}
          definitions={category.attributes.map((definition) => ({
            id: definition.id,
            key: definition.key,
            label: definition.label,
            unit: definition.unit,
            type: definition.type,
            group: definition.group,
            filterable: definition.filterable,
            comparable: definition.comparable,
            showInSpecs: definition.showInSpecs,
            sortOrder: definition.sortOrder,
            usedBy: definition._count.values,
          }))}
        />
      </div>

      <TaxonomyForm
        kind="category"
        recordId={category.id}
        initial={toTaxonomyValues(category)}
        parents={parents}
      />
    </>
  );
}
