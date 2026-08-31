import Link from "next/link";
import { Plus } from "lucide-react";

import { PageHeader, Panel, StatusPill, TableWrap, Td, Th } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export default async function AdminPagesPage() {
  await requireAdminPage("content.write");

  const pages = await db.page.findMany({
    orderBy: { slug: "asc" },
    select: { id: true, title: true, slug: true, status: true, updatedAt: true },
  });

  return (
    <>
      <PageHeader
        title="Pages"
        description="Policy and information pages. The storefront renders whatever is here, so shipping, returns and privacy copy can be corrected without a release."
        actions={
          <Button asChild size="sm">
            <Link href="/admin/pages/new">
              <Plus className="size-4" />
              New page
            </Link>
          </Button>
        }
      />

      <Panel>
        <TableWrap>
          <thead>
            <tr>
              <Th>Page</Th>
              <Th>Status</Th>
              <Th>Last edited</Th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page) => (
              <tr key={page.id}>
                <Td>
                  <Link href={`/admin/pages/${page.id}`} className="text-ink hover:underline">
                    {page.title}
                  </Link>
                  <span className="mt-0.5 block text-xs text-faint">/{page.slug}</span>
                </Td>
                <Td>
                  <StatusPill tone={page.status === "ACTIVE" ? "positive" : "warning"}>
                    {page.status === "ACTIVE" ? "Published" : "Draft"}
                  </StatusPill>
                </Td>
                <Td className="whitespace-nowrap text-xs">{formatDate(page.updatedAt)}</Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Panel>
    </>
  );
}
