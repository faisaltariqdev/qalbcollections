import Link from "next/link";
import { Plus } from "lucide-react";

import { PageHeader, Panel, StatusPill, TableWrap, Td, Th } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  COMING_SOON: "Coming soon",
  HIDDEN: "Hidden",
};

export default async function AdminCategoriesPage() {
  await requireAdminPage("category.write");

  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      featured: true,
      parentId: true,
      parent: { select: { name: true } },
      _count: { select: { products: true, attributes: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Categories"
        description="Categories decide what the storefront sells and which specifications each product carries. Switching one from coming soon to active is all a launch takes."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/categories/new">
              <Plus className="size-4" />
              New category
            </Link>
          </Button>
        }
      />

      <Panel>
        <TableWrap>
          <thead>
            <tr>
              <Th>Category</Th>
              <Th>Status</Th>
              <Th className="text-right">Products</Th>
              <Th className="text-right">Specifications</Th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <Td>
                  <Link
                    href={`/admin/categories/${category.id}`}
                    className="text-ink hover:underline"
                  >
                    {category.name}
                  </Link>
                  <span className="mt-0.5 block text-xs text-faint">
                    /category/{category.slug}
                    {category.parent ? ` · under ${category.parent.name}` : ""}
                  </span>
                </Td>
                <Td>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusPill
                      tone={
                        category.status === "ACTIVE"
                          ? "positive"
                          : category.status === "COMING_SOON"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {STATUS_LABELS[category.status] ?? category.status}
                    </StatusPill>
                    {category.featured ? <StatusPill>Featured</StatusPill> : null}
                  </div>
                </Td>
                <Td className="text-right" data-numeric>
                  {category._count.products}
                </Td>
                <Td className="text-right" data-numeric>
                  {category._count.attributes}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Panel>
    </>
  );
}
