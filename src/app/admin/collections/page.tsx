import Link from "next/link";
import { Plus } from "lucide-react";

import { AdminEmpty, PageHeader, Panel, StatusPill, TableWrap, Td, Th } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  COMING_SOON: "Coming soon",
  HIDDEN: "Hidden",
};

export default async function AdminCollectionsPage() {
  await requireAdminPage("collection.write");

  const collections = await db.collection.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      featured: true,
      _count: { select: { products: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Collections"
        description="Editorial groupings that cut across categories — a signature line, a seasonal edit, a gift selection."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/collections/new">
              <Plus className="size-4" />
              New collection
            </Link>
          </Button>
        }
      />

      {collections.length === 0 ? (
        <AdminEmpty
          title="No collections yet"
          description="Group products into an edit customers can browse as a story."
          action={
            <Button asChild size="sm">
              <Link href="/admin/collections/new">New collection</Link>
            </Button>
          }
        />
      ) : (
        <Panel>
          <TableWrap>
            <thead>
              <tr>
                <Th>Collection</Th>
                <Th>Status</Th>
                <Th className="text-right">Products</Th>
              </tr>
            </thead>
            <tbody>
              {collections.map((collection) => (
                <tr key={collection.id}>
                  <Td>
                    <Link
                      href={`/admin/collections/${collection.id}`}
                      className="text-ink hover:underline"
                    >
                      {collection.name}
                    </Link>
                    <span className="mt-0.5 block text-xs text-faint">
                      /collection/{collection.slug}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusPill tone={collection.status === "ACTIVE" ? "positive" : "neutral"}>
                        {STATUS_LABELS[collection.status] ?? collection.status}
                      </StatusPill>
                      {collection.featured ? <StatusPill>Featured</StatusPill> : null}
                    </div>
                  </Td>
                  <Td className="text-right" data-numeric>
                    {collection._count.products}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Panel>
      )}
    </>
  );
}
