import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/primitives";
import { requireCustomerPage } from "@/lib/auth/guards";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { paymentProviderLabel } from "@/lib/payments";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteSettings, whatsappLink } from "@/lib/settings";
import { formatDate } from "@/lib/utils";
import { getCustomerOrder } from "@/server/orders";

type Params = Promise<{ orderNumber: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { orderNumber } = await params;
  return buildMetadata({
    title: `Order ${orderNumber}`,
    description: "Your Qalb Collections order.",
    path: `/account/orders/${orderNumber}`,
    noIndex: true,
  });
}

export default async function AccountOrderPage({ params }: { params: Params }) {
  const { orderNumber } = await params;
  const customer = await requireCustomerPage(`/account/orders/${orderNumber}`);
  const order = await getCustomerOrder(customer.id, orderNumber);
  if (!order) notFound();

  const settings = await getSiteSettings();
  const whatsapp = whatsappLink(
    settings.whatsappNumber,
    `Hello Qalb Collections — a question about order ${order.orderNumber}.`,
  );

  return (
    <div>
      <Link
        href="/account/orders"
        className="eyebrow text-[0.5625rem] text-muted transition-colors hover:text-ink"
      >
        All orders
      </Link>

      <h2 className="mt-5 font-display text-3xl font-light text-ink" data-numeric>
        {order.orderNumber}
      </h2>
      <p className="mt-2 text-sm text-muted">Placed {formatDate(order.createdAt)}</p>

      <dl className="mt-9 grid gap-px border border-line bg-line sm:grid-cols-3">
        <Fact
          label="Status"
          value={ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
        />
        <Fact
          label="Payment"
          value={`${paymentProviderLabel(order.paymentMethod)} · ${
            PAYMENT_STATUS_LABELS[order.paymentStatus as PaymentStatus] ?? order.paymentStatus
          }`}
        />
        <Fact label="Total" value={formatMoney(order.total, order.currency)} />
      </dl>

      <section className="mt-14">
        <h3 className="eyebrow border-b border-line pb-3 text-ink">Your pieces</h3>
        <ul className="mt-7 space-y-6">
          {order.items.map((item) => (
            <li key={item.id} className="flex gap-5">
              <div className="relative aspect-4/5 w-16 shrink-0 overflow-hidden bg-shell">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="64px"
                    quality={75}
                    className="object-cover"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="eyebrow text-faint">{item.brand}</p>
                <p className="mt-1.5 text-sm text-ink">{item.name}</p>
                <p className="mt-1 text-xs text-faint" data-numeric>
                  {item.sku} · Qty {item.quantity}
                </p>
              </div>
              <p className="text-sm text-ink" data-numeric>
                {formatMoney(item.lineTotal, order.currency)}
              </p>
            </li>
          ))}
        </ul>

        <Divider className="mt-8" />
        <dl className="mt-6 space-y-2.5">
          <SummaryRow label="Subtotal" value={formatMoney(order.subtotal, order.currency)} />
          {order.discountTotal > 0 ? (
            <SummaryRow
              label={order.couponCode ? `Discount (${order.couponCode})` : "Discount"}
              value={`− ${formatMoney(order.discountTotal, order.currency)}`}
            />
          ) : null}
          <SummaryRow
            label="Delivery"
            value={
              order.shippingTotal === 0
                ? "Included"
                : formatMoney(order.shippingTotal, order.currency)
            }
          />
          <div className="flex items-baseline justify-between border-t border-line pt-4">
            <dt className="text-sm text-ink">Total</dt>
            <dd className="font-display text-xl font-light text-ink" data-numeric>
              {formatMoney(order.total, order.currency)}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-14 grid gap-10 sm:grid-cols-2">
        <div>
          <h3 className="eyebrow border-b border-line pb-3 text-ink">Delivering to</h3>
          <address className="mt-6 text-sm not-italic leading-loose text-muted">
            <span className="block text-ink">{order.shippingName}</span>
            {order.shippingLine1}
            <br />
            {order.shippingLine2 ? (
              <>
                {order.shippingLine2}
                <br />
              </>
            ) : null}
            {order.shippingCity}
            {order.shippingRegion ? `, ${order.shippingRegion}` : ""}
            {order.shippingPostalCode ? ` ${order.shippingPostalCode}` : ""}
            <br />
            {order.customerPhone}
          </address>
        </div>

        <div>
          <h3 className="eyebrow border-b border-line pb-3 text-ink">History</h3>
          <ol className="mt-6 space-y-5">
            {order.events.map((event) => (
              <li key={event.id} className="relative pl-6">
                <span
                  aria-hidden
                  className="absolute left-0 top-[0.4rem] size-1.5 rounded-full bg-qalb"
                />
                <p className="text-sm text-ink-soft">{event.message}</p>
                <p className="mt-1 text-xs text-faint">{formatDate(event.createdAt)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {order.notes ? (
        <section className="mt-14">
          <h3 className="eyebrow border-b border-line pb-3 text-ink">Your note</h3>
          <p className="mt-5 whitespace-pre-line text-sm leading-loose text-muted">{order.notes}</p>
        </section>
      ) : null}

      <div className="mt-14 border border-line bg-shell p-7">
        <p className="text-sm leading-relaxed text-ink-soft">
          Something not right, or a question about delivery? Message us with the order number and we
          will pick it up from there.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {whatsapp ? (
            <Button asChild variant="secondary">
              <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" />
                WhatsApp us
              </a>
            </Button>
          ) : null}
          <Button asChild variant="ghost">
            <Link href="/contact">Contact page</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-canvas px-6 py-5">
      <dt className="eyebrow text-faint">{label}</dt>
      <dd className="mt-2.5 text-sm text-ink" data-numeric>
        {value}
      </dd>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-sm text-ink" data-numeric>
        {value}
      </dd>
    </div>
  );
}
