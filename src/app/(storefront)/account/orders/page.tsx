import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { requireCustomerPage } from "@/lib/auth/guards";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { buildMetadata } from "@/lib/seo/metadata";
import { formatDate } from "@/lib/utils";
import { listCustomerOrders } from "@/server/orders";

export const metadata: Metadata = buildMetadata({
  title: "Your orders",
  description: "Every Qalb Collections order you have placed, with its current status.",
  path: "/account/orders",
  noIndex: true,
});

export default async function AccountOrdersPage() {
  const customer = await requireCustomerPage("/account/orders");
  const orders = await listCustomerOrders(customer.id);

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<Package className="size-5" />}
        title="No orders yet"
        description="When you place an order it will appear here — with its status, contents and delivery details."
        actions={
          <Button asChild variant="primary">
            <Link href="/watches">Explore watches</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <h2 className="eyebrow border-b border-line pb-3 text-ink">
        {orders.length} {orders.length === 1 ? "order" : "orders"}
      </h2>

      <ul className="mt-8 space-y-5">
        {orders.map((order) => (
          <li key={order.id} className="border border-line">
            <Link
              href={`/account/orders/${order.orderNumber}`}
              className="group block p-6 transition-colors hover:bg-shell/70"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                <div>
                  <p className="text-sm text-ink" data-numeric>
                    {order.orderNumber}
                  </p>
                  <p className="mt-1 text-xs text-faint">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-5">
                  <span className="border border-line-soft px-2.5 py-1 text-[0.625rem] uppercase tracking-[0.12em] text-muted">
                    {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                  </span>
                  <span className="text-sm text-ink" data-numeric>
                    {formatMoney(order.total, order.currency)}
                  </span>
                  <ArrowRight
                    aria-hidden
                    className="size-4 text-faint transition-transform group-hover:translate-x-0.5"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-end justify-between gap-6">
                <ul className="flex gap-2">
                  {order.items.slice(0, 4).map((item) => (
                    <li key={item.id} className="relative aspect-4/5 w-12 overflow-hidden bg-shell">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          sizes="48px"
                          quality={75}
                          className="object-cover"
                        />
                      ) : null}
                    </li>
                  ))}
                  {order.items.length > 4 ? (
                    <li className="flex aspect-4/5 w-12 items-center justify-center bg-shell text-xs text-muted">
                      +{order.items.length - 4}
                    </li>
                  ) : null}
                </ul>
                <p className="text-xs text-faint">
                  Payment{" "}
                  {(
                    PAYMENT_STATUS_LABELS[order.paymentStatus as PaymentStatus] ??
                    order.paymentStatus
                  ).toLowerCase()}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
