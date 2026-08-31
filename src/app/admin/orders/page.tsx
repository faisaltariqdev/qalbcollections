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
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { paymentProviderLabel } from "@/lib/payments";
import { formatDate } from "@/lib/utils";
import { listAdminOrders } from "@/server/admin/orders";

type Search = Promise<{ q?: string; status?: string; paymentStatus?: string; page?: string }>;

const STATUS_TONES: Partial<Record<OrderStatus, "positive" | "warning" | "danger" | "accent">> = {
  PENDING: "warning",
  CONFIRMED: "accent",
  PROCESSING: "accent",
  SHIPPED: "accent",
  DELIVERED: "positive",
  CANCELLED: "danger",
  RETURNED: "danger",
};

export default async function AdminOrdersPage({ searchParams }: { searchParams: Search }) {
  await requireAdminPage("order.read");
  const params = await searchParams;

  const { orders, total, revenue, page, pageCount } = await listAdminOrders({
    q: params.q,
    status: params.status,
    paymentStatus: params.paymentStatus,
    page: Number.parseInt(params.page ?? "1", 10) || 1,
  });

  function hrefWith(overrides: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...params, ...overrides })) {
      if (value) next.set(key, value);
    }
    const query = next.toString();
    return query ? `/admin/orders?${query}` : "/admin/orders";
  }

  return (
    <>
      <PageHeader
        title="Orders"
        description={`${total} ${total === 1 ? "order" : "orders"} matching · ${formatMoney(
          revenue,
          orders[0]?.currency ?? "PKR",
        )} in value`}
      />

      <Panel className="mb-6">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="min-w-48 flex-1">
            <span className="eyebrow block text-[0.5rem] text-faint">Search</span>
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Order number, name, email or phone"
              className="mt-1.5 w-full border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            />
          </label>

          <label>
            <span className="eyebrow block text-[0.5rem] text-faint">Status</span>
            <select
              name="status"
              defaultValue={params.status ?? ""}
              className="mt-1.5 border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            >
              <option value="">Any status</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {ORDER_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="eyebrow block text-[0.5rem] text-faint">Payment</span>
            <select
              name="paymentStatus"
              defaultValue={params.paymentStatus ?? ""}
              className="mt-1.5 border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none focus:border-ink"
            >
              <option value="">Any payment</option>
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {PAYMENT_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>

          <Button type="submit" variant="secondary" size="sm">
            Apply
          </Button>
          {params.q || params.status || params.paymentStatus ? (
            <Link href="/admin/orders" className="pb-2 text-xs text-muted hover:text-ink">
              Clear
            </Link>
          ) : null}
        </form>
      </Panel>

      {orders.length === 0 ? (
        <AdminEmpty
          title="No orders match"
          description="Try a different status, or clear the filters."
        />
      ) : (
        <Panel>
          <TableWrap>
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Items</Th>
                <Th>Status</Th>
                <Th>Payment</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <Td>
                    <Link
                      href={`/admin/orders/${order.orderNumber}`}
                      className="text-ink hover:underline"
                      data-numeric
                    >
                      {order.orderNumber}
                    </Link>
                    <span className="mt-0.5 block whitespace-nowrap text-xs text-faint">
                      {formatDate(order.createdAt)}
                    </span>
                  </Td>
                  <Td>
                    <span className="block text-sm">{order.customerName}</span>
                    <span className="mt-0.5 block truncate text-xs text-faint">
                      {order.customerEmail}
                    </span>
                  </Td>
                  <Td data-numeric>{order._count.items}</Td>
                  <Td>
                    <StatusPill tone={STATUS_TONES[order.status as OrderStatus] ?? "neutral"}>
                      {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                    </StatusPill>
                  </Td>
                  <Td className="text-xs">
                    <span className="block">
                      {PAYMENT_STATUS_LABELS[order.paymentStatus as PaymentStatus] ??
                        order.paymentStatus}
                    </span>
                    <span className="mt-0.5 block text-faint">
                      {paymentProviderLabel(order.paymentMethod)}
                    </span>
                  </Td>
                  <Td className="text-right" data-numeric>
                    {formatMoney(order.total, order.currency)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>

          <Pagination
            page={page}
            pageCount={pageCount}
            hrefFor={(target) => hrefWith({ page: String(target) })}
          />
        </Panel>
      )}
    </>
  );
}
