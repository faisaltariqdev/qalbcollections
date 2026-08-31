import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderControls } from "@/components/admin/order-controls";
import { PageHeader, Panel, StatusPill, TableWrap, Td, Th } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth/guards";
import { can } from "@/lib/auth/permissions";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { paymentProviderLabel } from "@/lib/payments";
import { formatDateTime } from "@/lib/utils";
import { getAdminOrder } from "@/server/admin/orders";

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const admin = await requireAdminPage("order.read");
  const { orderNumber } = await params;
  const order = await getAdminOrder(orderNumber);
  if (!order) notFound();

  const status = order.status as OrderStatus;
  const payment = order.paymentStatus as PaymentStatus;
  const address = [
    order.shippingName,
    order.shippingLine1,
    order.shippingLine2,
    order.shippingCity,
    order.shippingRegion,
    order.shippingPostalCode,
  ].filter(Boolean);

  return (
    <>
      <PageHeader
        breadcrumb={{ label: "Orders", href: "/admin/orders" }}
        title={order.orderNumber}
        description={`Placed ${formatDateTime(order.createdAt)} · ${paymentProviderLabel(order.paymentMethod)}`}
        actions={
          <div className="flex items-center gap-2">
            <StatusPill tone={status === "CANCELLED" || status === "RETURNED" ? "danger" : status === "DELIVERED" ? "positive" : "accent"}>
              {ORDER_STATUS_LABELS[status] ?? order.status}
            </StatusPill>
            <StatusPill tone={payment === "PAID" ? "positive" : payment === "REFUNDED" ? "danger" : "warning"}>
              {PAYMENT_STATUS_LABELS[payment] ?? order.paymentStatus}
            </StatusPill>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Panel title="Items">
            <TableWrap>
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th className="text-right">Unit</Th>
                  <Th className="text-right">Qty</Th>
                  <Th className="text-right">Line</Th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt=""
                            width={48}
                            height={60}
                            quality={75}
                            className="h-15 w-12 shrink-0 object-cover"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <span className="eyebrow block text-[0.5rem] text-faint">
                            {item.brand}
                          </span>
                          <span className="block truncate text-sm text-ink">{item.name}</span>
                          <span className="mt-0.5 block text-xs text-faint" data-numeric>
                            {item.sku}
                            {item.variant ? ` · ${item.variant}` : ""}
                          </span>
                        </div>
                      </div>
                    </Td>
                    <Td className="text-right" data-numeric>
                      {formatMoney(item.unitPrice, order.currency)}
                    </Td>
                    <Td className="text-right" data-numeric>
                      {item.quantity}
                    </Td>
                    <Td className="text-right" data-numeric>
                      {formatMoney(item.lineTotal, order.currency)}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>

            <dl className="ml-auto mt-6 w-full max-w-xs space-y-2 text-sm">
              <Row label="Subtotal" value={formatMoney(order.subtotal, order.currency)} />
              {order.discountTotal > 0 ? (
                <Row
                  label={order.couponCode ? `Discount (${order.couponCode})` : "Discount"}
                  value={`− ${formatMoney(order.discountTotal, order.currency)}`}
                />
              ) : null}
              <Row
                label="Delivery"
                value={
                  order.shippingTotal === 0
                    ? "Complimentary"
                    : formatMoney(order.shippingTotal, order.currency)
                }
              />
              {order.taxTotal > 0 ? (
                <Row label="Tax" value={formatMoney(order.taxTotal, order.currency)} />
              ) : null}
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <dt className="eyebrow text-[0.5625rem] text-ink">Total</dt>
                <dd className="text-base text-ink" data-numeric>
                  {formatMoney(order.total, order.currency)}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Timeline">
            <ol className="space-y-5">
              {order.events.map((event) => (
                <li key={event.id} className="border-l border-line pl-5">
                  <span className="eyebrow block text-[0.5rem] text-faint">
                    {formatDateTime(event.createdAt)}
                    {event.actor ? ` · ${event.actor}` : ""}
                  </span>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{event.message}</p>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Customer">
            <div className="space-y-3 text-sm text-ink-soft">
              <p className="text-ink">{order.customerName}</p>
              <p>
                <a href={`mailto:${order.customerEmail}`} className="hover:text-ink">
                  {order.customerEmail}
                </a>
              </p>
              <p data-numeric>
                <a href={`tel:${order.customerPhone}`} className="hover:text-ink">
                  {order.customerPhone}
                </a>
              </p>
              {order.customer ? (
                <Link
                  href={`/admin/customers/${order.customer.id}`}
                  className="eyebrow block text-[0.5rem] text-muted hover:text-ink"
                >
                  View account
                </Link>
              ) : (
                <p className="eyebrow text-[0.5rem] text-faint">Guest checkout</p>
              )}
            </div>
          </Panel>

          <Panel title="Delivery address">
            <address className="space-y-1 text-sm not-italic leading-relaxed text-ink-soft">
              {address.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              <span className="block">{order.shippingCountry}</span>
            </address>
            {order.notes ? (
              <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-muted">
                <span className="eyebrow block text-[0.5rem] text-faint">Customer note</span>
                {order.notes}
              </p>
            ) : null}
          </Panel>

          {can(admin.role, "order.write") ? (
            <Panel title="Manage">
              <OrderControls
                orderNumber={order.orderNumber}
                status={status}
                paymentStatus={payment}
                transitions={ORDER_STATUS_TRANSITIONS[status] ?? []}
              />
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="text-ink-soft" data-numeric>
        {value}
      </dd>
    </div>
  );
}
