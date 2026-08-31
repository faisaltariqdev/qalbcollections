import Link from "next/link";

import {
  AdminEmpty,
  PageHeader,
  Pagination,
  Panel,
  StatusPill,
  TableWrap,
  Td,
  Th,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth/guards";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { listAdminCustomers } from "@/server/admin/customers";

type Search = Promise<{ q?: string; state?: string; page?: string }>;

const STATES = [
  { value: "", label: "Everyone" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Deactivated" },
  { value: "subscribed", label: "Newsletter" },
] as const;

export default async function AdminCustomersPage({ searchParams }: { searchParams: Search }) {
  await requireAdminPage("customer.read");
  const params = await searchParams;

  const state = STATES.some((option) => option.value === params.state)
    ? (params.state as "active" | "inactive" | "subscribed" | undefined)
    : undefined;

  const { customers, total, page, pageCount } = await listAdminCustomers({
    q: params.q,
    state: state || undefined,
    page: Number.parseInt(params.page ?? "1", 10) || 1,
  });

  return (
    <>
      <PageHeader
        title="Customers"
        description={`${total} ${total === 1 ? "account" : "accounts"}`}
      />

      <Panel className="mb-6">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="min-w-48 flex-1">
            <span className="eyebrow block text-[0.5rem] text-faint">Search</span>
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Name, email or phone"
              className="mt-1.5 w-full border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </label>
          <label>
            <span className="eyebrow block text-[0.5rem] text-faint">Show</span>
            <select
              name="state"
              defaultValue={state ?? ""}
              className="mt-1.5 border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            >
              {STATES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="secondary" size="sm">
            Apply
          </Button>
          {params.q || state ? (
            <Link href="/admin/customers" className="pb-2 text-xs text-muted hover:text-ink">
              Clear
            </Link>
          ) : null}
        </form>
      </Panel>

      {customers.length === 0 ? (
        <AdminEmpty title="No customers match" description="Try a broader search." />
      ) : (
        <Panel>
          <TableWrap>
            <thead>
              <tr>
                <Th>Customer</Th>
                <Th>Joined</Th>
                <Th className="text-right">Orders</Th>
                <Th className="text-right">Lifetime</Th>
                <Th>State</Th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <Td>
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="text-ink hover:underline"
                    >
                      {customer.name}
                    </Link>
                    <span className="mt-0.5 block truncate text-xs text-faint">
                      {customer.email}
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap text-xs">{formatDate(customer.createdAt)}</Td>
                  <Td className="text-right" data-numeric>
                    {customer._count.orders}
                  </Td>
                  <Td className="text-right" data-numeric>
                    {formatMoney(customer.lifetimeSpend, customer.currency)}
                  </Td>
                  <Td>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusPill tone={customer.active ? "positive" : "danger"}>
                        {customer.active ? "Active" : "Deactivated"}
                      </StatusPill>
                      {customer.marketingOptIn ? <StatusPill>Newsletter</StatusPill> : null}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>

          <Pagination
            page={page}
            pageCount={pageCount}
            hrefFor={(target) => {
              const next = new URLSearchParams();
              if (params.q) next.set("q", params.q);
              if (state) next.set("state", state);
              next.set("page", String(target));
              return `/admin/customers?${next.toString()}`;
            }}
          />
        </Panel>
      )}
    </>
  );
}
