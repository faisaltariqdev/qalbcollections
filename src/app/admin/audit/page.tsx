import Link from "next/link";

import { AdminEmpty, PageHeader, Pagination, Panel, TableWrap, Td, Th } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

const PER_PAGE = 50;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; entity?: string }>;
}) {
  await requireAdminPage("audit.read");
  const params = await searchParams;

  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const where = params.entity ? { entity: params.entity } : {};

  const [entries, total, entities] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    db.auditLog.count({ where }),
    db.auditLog.groupBy({ by: ["entity"], _count: { _all: true } }),
  ]);

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every administrative write, with who made it. Read-only by design — the point of a log is that it cannot be edited."
      />

      {entities.length > 1 ? (
        <nav aria-label="Filter by entity" className="mb-6 flex flex-wrap gap-x-4 gap-y-2 text-xs">
          <Link
            href="/admin/audit"
            className={params.entity ? "text-muted hover:text-ink" : "text-ink"}
          >
            All
          </Link>
          {entities
            .sort((a, b) => a.entity.localeCompare(b.entity))
            .map((entry) => (
              <Link
                key={entry.entity}
                href={`/admin/audit?entity=${entry.entity}`}
                className={params.entity === entry.entity ? "text-ink" : "text-muted hover:text-ink"}
              >
                {entry.entity} ({entry._count._all})
              </Link>
            ))}
        </nav>
      ) : null}

      {entries.length === 0 ? (
        <AdminEmpty
          title="Nothing recorded yet"
          description="Administrative changes will appear here as they happen."
        />
      ) : (
        <Panel>
          <TableWrap>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Who</Th>
                <Th>Action</Th>
                <Th>Detail</Th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <Td className="whitespace-nowrap text-xs">{formatDateTime(entry.createdAt)}</Td>
                  <Td className="text-xs">{entry.actorEmail ?? "system"}</Td>
                  <Td className="text-xs text-ink" data-numeric>
                    {entry.action}
                  </Td>
                  <Td className="text-xs text-muted">
                    {entry.summary ?? entry.entity}
                    {entry.entityId ? (
                      <span className="mt-0.5 block text-faint" data-numeric>
                        {entry.entity} · {entry.entityId}
                      </span>
                    ) : null}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>

          <Pagination
            page={page}
            pageCount={Math.max(1, Math.ceil(total / PER_PAGE))}
            hrefFor={(target) =>
              params.entity
                ? `/admin/audit?entity=${params.entity}&page=${target}`
                : `/admin/audit?page=${target}`
            }
          />
        </Panel>
      )}
    </>
  );
}
