import Link from "next/link";
import { notFound } from "next/navigation";

import { CustomerStateToggle } from "@/components/admin/customer-state-toggle";
import {
  AdminEmpty,
  PageHeader,
  Panel,
  StatCard,
  StatusPill,
  TableWrap,
  Td,
  Th,
} from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth/guards";
import { can } from "@/lib/auth/permissions";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { getAdminCustomer } from "@/server/admin/customers";

export default async function AdminCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdminPage("customer.read");
  const { id } = await params;
  const customer = await getAdminCustomer(id);
  if (!customer) notFound();

  const lastOrder = customer.orders[0];

  return (
    <>
      <PageHeader
        breadcrumb={{ label: "Customers", href: "/admin/customers" }}
        title={customer.name}
        description={`Joined ${formatDate(customer.createdAt)} · ${customer.email}`}
        actions={
          can(admin.role, "customer.write") ? (
            <CustomerStateToggle
              customerId={customer.id}
              active={customer.active}
              name={customer.name}
            />
          ) : null
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Orders" value={String(customer.orders.length)} />
        <StatCard
          label="Lifetime spend"
          value={formatMoney(customer.lifetimeSpend, customer.currency)}
          hint="Confirmed orders only"
        />
        <StatCard
          label="Last order"
          value={lastOrder ? formatDate(lastOrder.createdAt) : "—"}
          hint={lastOrder?.orderNumber}
        />
        <StatCard
          label="Newsletter"
          value={customer.marketingOptIn ? "Subscribed" : "Not subscribed"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Panel title="Order history">
          {customer.orders.length === 0 ? (
            <AdminEmpty
              title="No orders yet"
              description="This account has been created but nothing has been ordered."
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Order</Th>
                  <Th>Placed</Th>
                  <Th className="text-right">Items</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {customer.orders.map((order) => (
                  <tr key={order.id}>
                    <Td>
                      <Link
                        href={`/admin/orders/${order.orderNumber}`}
                        className="text-ink hover:underline"
                        data-numeric
                      >
                        {order.orderNumber}
                      </Link>
                    </Td>
                    <Td className="whitespace-nowrap text-xs">{formatDate(order.createdAt)}</Td>
                    <Td className="text-right" data-numeric>
                      {order._count.items}
                    </Td>
                    <Td>
                      <StatusPill
                        tone={
                          order.status === "DELIVERED"
                            ? "positive"
                            : order.status === "CANCELLED" || order.status === "RETURNED"
                              ? "danger"
                              : "accent"
                        }
                      >
                        {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                      </StatusPill>
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
          <Panel title="Contact">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="eyebrow text-[0.5rem] text-faint">Email</dt>
                <dd className="mt-1 break-all text-ink-soft">
                  <a href={`mailto:${customer.email}`} className="hover:text-ink">
                    {customer.email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="eyebrow text-[0.5rem] text-faint">Phone</dt>
                <dd className="mt-1 text-ink-soft" data-numeric>
                  {customer.phone ? (
                    <a href={`tel:${customer.phone}`} className="hover:text-ink">
                      {customer.phone}
                    </a>
                  ) : (
                    "Not provided"
                  )}
                </dd>
              </div>
              <div>
                <dt className="eyebrow text-[0.5rem] text-faint">Sign-in method</dt>
                <dd className="mt-1 text-ink-soft">{customer.authProvider}</dd>
              </div>
            </dl>
          </Panel>

          {customer.addresses.length > 0 ? (
            <Panel title="Saved addresses">
              <ul className="space-y-4 text-sm leading-relaxed text-ink-soft">
                {customer.addresses.map((address) => (
                  <li key={address.id}>
                    {address.label ? (
                      <span className="eyebrow block text-[0.5rem] text-faint">
                        {address.label}
                      </span>
                    ) : null}
                    <span className="block">{address.line1}</span>
                    {address.line2 ? <span className="block">{address.line2}</span> : null}
                    <span className="block">
                      {[address.city, address.region, address.postalCode]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {customer.saved.length > 0 ? (
            <Panel title="Saved pieces" description="What this customer is considering.">
              <ul className="space-y-3 text-sm">
                {customer.saved.map((product) => (
                  <li key={product.id}>
                    <span className="eyebrow block text-[0.5rem] text-faint">{product.brand}</span>
                    <Link
                      href={`/product/${product.slug}`}
                      prefetch={false}
                      className="text-ink-soft hover:text-ink"
                    >
                      {product.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  );
}
