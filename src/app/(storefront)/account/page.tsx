import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart, Package, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { requireCustomerPage } from "@/lib/auth/guards";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { buildMetadata } from "@/lib/seo/metadata";
import { formatDate } from "@/lib/utils";
import { listCustomerOrders } from "@/server/orders";

export const metadata: Metadata = buildMetadata({
  title: "Your account",
  description: "Your Qalb Collections orders, saved pieces and details.",
  path: "/account",
  noIndex: true,
});

export default async function AccountPage() {
  const customer = await requireCustomerPage("/account");
  const orders = await listCustomerOrders(customer.id);

  const lifetime = orders
    .filter((order) => order.status !== "CANCELLED")
    .reduce((sum, order) => sum + order.total, 0);
  const currency = orders[0]?.currency ?? "PKR";
  const latest = orders[0];

  return (
    <div className="space-y-14">
      <section>
        <h2 className="eyebrow border-b border-line pb-3 text-ink">At a glance</h2>
        <dl className="mt-7 grid gap-px border border-line bg-line sm:grid-cols-3">
          <Stat label="Orders" value={String(orders.length)} />
          <Stat
            label="Lifetime spend"
            value={orders.length > 0 ? formatMoney(lifetime, currency) : "—"}
          />
          <Stat
            label="Last order"
            value={latest ? formatDate(latest.createdAt) : "—"}
          />
        </dl>
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
          <h2 className="eyebrow text-ink">Recent orders</h2>
          {orders.length > 0 ? (
            <Link
              href="/account/orders"
              className="eyebrow text-[0.5625rem] text-muted transition-colors hover:text-ink"
            >
              All orders
            </Link>
          ) : null}
        </div>

        {orders.length === 0 ? (
          <EmptyState
            className="mt-7"
            icon={<Package className="size-5" />}
            title="No orders yet"
            description="When you place an order it will appear here, with its status and delivery details."
            actions={
              <Button asChild variant="primary">
                <Link href="/watches">Explore watches</Link>
              </Button>
            }
          />
        ) : (
          <ul className="mt-7 divide-y divide-line-soft border-b border-line-soft">
            {orders.slice(0, 3).map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.orderNumber}`}
                  className="group flex items-center justify-between gap-6 py-5"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-ink" data-numeric>
                      {order.orderNumber}
                    </p>
                    <p className="mt-1 truncate text-xs text-faint">
                      {formatDate(order.createdAt)} ·{" "}
                      {order.items.length === 1
                        ? order.items[0]!.name
                        : `${order.items.length} pieces`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-5">
                    <span className="text-xs text-muted">
                      {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                    </span>
                    <span className="text-sm text-ink" data-numeric>
                      {formatMoney(order.total, order.currency)}
                    </span>
                    <ArrowRight className="size-4 text-faint transition-colors group-hover:text-ink" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="eyebrow border-b border-line pb-3 text-ink">Elsewhere</h2>
        <ul className="mt-7 grid gap-px border border-line bg-line sm:grid-cols-2">
          <ShortcutCard
            href="/account/wishlist"
            icon={<Heart className="size-4" />}
            title="Wishlist"
            description="The pieces you have saved, on every device you sign in from."
          />
          <ShortcutCard
            href="/account/profile"
            icon={<User className="size-4" />}
            title="Profile"
            description="Your name, phone number, email preferences and password."
          />
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-canvas px-6 py-7">
      <dt className="eyebrow text-faint">{label}</dt>
      <dd className="mt-3 font-display text-2xl font-light text-ink" data-numeric>
        {value}
      </dd>
    </div>
  );
}

function ShortcutCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <li className="bg-canvas">
      <Link href={href} className="group flex h-full gap-4 p-6 transition-colors hover:bg-shell">
        <span aria-hidden className="mt-0.5 text-qalb">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-2 text-base text-ink">
            {title}
            <ArrowRight className="size-3.5 text-faint transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="mt-1.5 block text-xs leading-relaxed text-muted">{description}</span>
        </span>
      </Link>
    </li>
  );
}
