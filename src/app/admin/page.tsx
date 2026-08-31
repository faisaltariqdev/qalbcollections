import Link from "next/link";

import { MiniChart } from "@/components/admin/mini-chart";
import { AdminEmpty, PageHeader, Panel, StatCard, StatusPill, TableWrap, Td, Th } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth/guards";
import { can } from "@/lib/auth/permissions";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { cn, formatDate } from "@/lib/utils";
import { DASHBOARD_RANGES, getDashboard, parseRange } from "@/server/admin/dashboard";

const STATUS_TONES: Partial<Record<OrderStatus, "positive" | "warning" | "danger" | "accent">> = {
  PENDING: "warning",
  CONFIRMED: "accent",
  PROCESSING: "accent",
  SHIPPED: "accent",
  DELIVERED: "positive",
  CANCELLED: "danger",
  RETURNED: "danger",
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const admin = await requireAdminPage("dashboard.view");
  const params = await searchParams;
  const range = parseRange(params.range);
  const data = await getDashboard(range);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Trading since ${formatDate(data.from)}. Figures exclude cancelled and returned orders.`}
        actions={
          <div className="flex items-center border border-line">
            {Object.entries(DASHBOARD_RANGES).map(([key, value]) => (
              <Link
                key={key}
                href={`/admin?range=${key}`}
                aria-current={range === key ? "true" : undefined}
                className={cn(
                  "px-3 py-2 text-xs transition-colors",
                  range === key ? "bg-ink text-canvas" : "text-muted hover:text-ink",
                )}
              >
                {value.label}
              </Link>
            ))}
          </div>
        }
      />

      <div className="grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatMoney(data.revenue, data.currency)}
          hint={`${data.orderCount} ${data.orderCount === 1 ? "order" : "orders"} placed`}
        />
        <StatCard
          label="Average order"
          value={formatMoney(data.averageOrderValue, data.currency)}
          hint="Per completed order"
        />
        <StatCard
          label="New customers"
          value={String(data.newCustomers)}
          hint="Accounts created in period"
          href={can(admin.role, "customer.read") ? "/admin/customers" : undefined}
        />
        <StatCard
          label="Awaiting action"
          value={String(data.pendingOrders)}
          hint="Orders still pending"
          href={can(admin.role, "order.read") ? "/admin/orders?status=PENDING" : undefined}
        />
      </div>

      <div className="mt-px grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Published products"
          value={`${data.publishedProducts} / ${data.totalProducts}`}
          hint="Live in the catalogue"
          href={can(admin.role, "product.read") ? "/admin/products" : undefined}
        />
        <StatCard
          label="Out of stock"
          value={String(data.outOfStock)}
          hint="Published but unavailable"
          href={can(admin.role, "product.read") ? "/admin/products?stock=out" : undefined}
        />
        <StatCard
          label="Low stock"
          value={String(data.lowStock.length)}
          hint="At or below threshold"
          href={can(admin.role, "product.read") ? "/admin/products?stock=low" : undefined}
        />
        <StatCard
          label="Unread enquiries"
          value={String(data.unreadMessages)}
          hint="From the contact form"
          href={can(admin.role, "customer.read") ? "/admin/messages" : undefined}
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Revenue" description={`By day, ${DASHBOARD_RANGES[range].label.toLowerCase()}`}>
          <MiniChart series={data.series} currency={data.currency} />
        </Panel>

        <Panel title="Best sellers" description="By revenue in this period">
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-muted">Nothing sold in this period.</p>
          ) : (
            <ol className="space-y-4">
              {data.topProducts.map((product, index) => (
                <li key={`${product.brand}-${product.name}`} className="flex gap-4">
                  <span className="text-xs text-faint" data-numeric>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{product.name}</span>
                    <span className="mt-0.5 block text-xs text-faint">
                      {product.brand} · {product.quantity} sold
                    </span>
                  </span>
                  <span className="text-sm text-ink" data-numeric>
                    {formatMoney(product.revenue, data.currency)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel
          title="Recent orders"
          actions={
            can(admin.role, "order.read") ? (
              <Link href="/admin/orders" className="text-xs text-muted hover:text-ink">
                All orders
              </Link>
            ) : null
          }
        >
          {data.recentOrders.length === 0 ? (
            <AdminEmpty title="No orders in this period" />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Status</Th>
                  <Th>Payment</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <Td>
                      <Link
                        href={`/admin/orders/${order.orderNumber}`}
                        className="text-ink hover:underline"
                        data-numeric
                      >
                        {order.orderNumber}
                      </Link>
                      <span className="mt-0.5 block text-xs text-faint">
                        {formatDate(order.createdAt)}
                      </span>
                    </Td>
                    <Td>{order.customerName}</Td>
                    <Td>
                      <StatusPill tone={STATUS_TONES[order.status as OrderStatus] ?? "neutral"}>
                        {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                      </StatusPill>
                    </Td>
                    <Td className="text-xs">
                      {PAYMENT_STATUS_LABELS[order.paymentStatus as PaymentStatus] ??
                        order.paymentStatus}
                    </Td>
                    <Td className="text-right" data-numeric>
                      {formatMoney(order.total, order.currency)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Needs restocking">
            {data.lowStock.length === 0 ? (
              <p className="text-sm text-muted">Every published piece is above its threshold.</p>
            ) : (
              <ul className="space-y-3.5">
                {data.lowStock.map((product) => (
                  <li key={product.id} className="flex items-baseline justify-between gap-4">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="min-w-0 truncate text-sm text-ink hover:underline"
                    >
                      {product.name}
                    </Link>
                    <StatusPill tone={product.stock === 0 ? "danger" : "warning"}>
                      {product.stock} left
                    </StatusPill>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Category performance">
            {data.categoryPerformance.length === 0 ? (
              <p className="text-sm text-muted">No sales in this period.</p>
            ) : (
              <ul className="space-y-3.5">
                {data.categoryPerformance.map((category) => (
                  <li key={category.name}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-sm text-ink">{category.name}</span>
                      <span className="text-xs text-muted" data-numeric>
                        {formatMoney(category.revenue, data.currency)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 bg-shell-deep">
                      <div
                        className="h-full bg-qalb"
                        style={{
                          width: `${Math.round(
                            (category.revenue / (data.categoryPerformance[0]?.revenue || 1)) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
