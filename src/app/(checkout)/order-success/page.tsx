import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Truck } from "lucide-react";

import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Container, Divider, Eyebrow, GiltRule } from "@/components/ui/primitives";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/constants";
import { formatMoney } from "@/lib/money";
import { paymentProviderLabel, getPaymentProvider } from "@/lib/payments";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteSettings, whatsappLink } from "@/lib/settings";
import { formatDate } from "@/lib/utils";
import { getOrderForConfirmation } from "@/server/orders";

/**
 * Order confirmation.
 *
 * Reachable only with the order number and its opaque token, so a guest can see
 * their own order without an account and nobody can enumerate anyone else's.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Order confirmed",
  description: "Your Qalb Collections order has been received.",
  path: "/order-success",
  noIndex: true,
});

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; token?: string }>;
}) {
  const { order: orderNumber, token } = await searchParams;
  const order = await getOrderForConfirmation(orderNumber ?? "", token ?? "");
  if (!order) notFound();

  const settings = await getSiteSettings();
  const provider = getPaymentProvider(order.paymentMethod);
  const whatsapp = whatsappLink(
    settings.whatsappNumber,
    `Hello Qalb Collections — a question about order ${order.orderNumber}.`,
  );

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line">
        <Container className="flex h-20 items-center">
          <Link href="/" aria-label="Qalb Collections — home">
            <Logo size="sm" />
          </Link>
        </Container>
      </header>

      <Container size="narrow" className="py-16 lg:py-24">
        <div className="flex size-12 items-center justify-center rounded-full border border-gilt/40 text-gilt">
          <Check className="size-5" strokeWidth={1.5} />
        </div>

        <Eyebrow className="mt-8 text-qalb">Order received</Eyebrow>
        <h1 className="mt-5 text-display-md text-ink">Thank you — it&rsquo;s with us.</h1>
        <GiltRule className="mt-7" />
        <p className="mt-7 text-base leading-relaxed text-muted">
          We have your order and will confirm it by phone or email before dispatch. Delivery
          normally takes {settings.shippingLeadTime} once confirmed.
        </p>

        {/* Order facts */}
        <dl className="mt-12 grid gap-x-10 gap-y-5 border-y border-line py-7 sm:grid-cols-2">
          <Fact label="Order number" value={order.orderNumber} />
          <Fact label="Placed" value={formatDate(order.createdAt)} />
          <Fact
            label="Status"
            value={ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
          />
          <Fact label="Payment" value={paymentProviderLabel(order.paymentMethod)} />
        </dl>

        {provider?.postOrderNote ? (
          <div className="mt-8 border border-line bg-shell p-6">
            <h2 className="eyebrow text-ink">What happens next</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">
              {provider.postOrderNote}
            </p>
          </div>
        ) : null}

        {/* Items */}
        <section className="mt-12">
          <h2 className="eyebrow border-b border-line pb-3 text-ink">Your pieces</h2>
          <ul className="mt-6 space-y-6">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-4">
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
                  <p className="text-xs text-muted">{item.brand}</p>
                  <p className="mt-0.5 text-sm text-ink">{item.name}</p>
                  <p className="mt-1 text-xs text-faint" data-numeric>
                    Ref. {item.sku} · Qty {item.quantity}
                  </p>
                </div>
                <p className="shrink-0 text-sm text-ink" data-numeric>
                  {formatMoney(item.lineTotal, order.currency)}
                </p>
              </li>
            ))}
          </ul>

          <Divider className="my-7" />

          <dl className="space-y-3.5 text-sm">
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
                  ? "Complimentary"
                  : formatMoney(order.shippingTotal, order.currency)
              }
            />
            {order.taxTotal > 0 ? (
              <SummaryRow label="Tax" value={formatMoney(order.taxTotal, order.currency)} />
            ) : null}
          </dl>

          <div className="mt-6 flex items-baseline justify-between border-t border-line pt-5">
            <span className="eyebrow text-ink">Total</span>
            <span className="font-display text-2xl text-ink" data-numeric>
              {formatMoney(order.total, order.currency)}
            </span>
          </div>
        </section>

        {/* Delivery address */}
        <section className="mt-12">
          <h2 className="eyebrow border-b border-line pb-3 text-ink">Delivering to</h2>
          <address className="mt-6 text-sm not-italic leading-relaxed text-muted">
            {order.shippingName}
            <br />
            {order.shippingLine1}
            {order.shippingLine2 ? (
              <>
                <br />
                {order.shippingLine2}
              </>
            ) : null}
            <br />
            {order.shippingCity}
            {order.shippingRegion ? `, ${order.shippingRegion}` : ""}
            {order.shippingPostalCode ? ` ${order.shippingPostalCode}` : ""}
            <br />
            {order.customerPhone}
          </address>

          <p className="mt-6 flex items-start gap-2.5 text-xs leading-relaxed text-muted">
            <Truck className="mt-px size-3.5 shrink-0 text-gilt" strokeWidth={1.5} />
            You will receive a tracking reference once the parcel is collected.
          </p>
        </section>

        <div className="mt-14 flex flex-wrap gap-3 border-t border-line pt-10">
          <Button asChild variant="primary">
            <Link href="/watches">Continue browsing</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/account/orders">View your orders</Link>
          </Button>
          {whatsapp ? (
            <Button asChild variant="ghost">
              <a href={whatsapp} target="_blank" rel="noopener noreferrer">
                Question about this order
              </a>
            </Button>
          ) : (
            <Button asChild variant="ghost">
              <Link href="/contact">Question about this order</Link>
            </Button>
          )}
        </div>

        <p className="mt-8 text-xs leading-relaxed text-faint">
          Keep this page bookmarked, or sign in with {order.customerEmail} to see the order in your
          account.
        </p>
      </Container>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow text-[0.5625rem] text-faint">{label}</dt>
      <dd className="mt-1.5 text-sm text-ink" data-numeric>
        {value}
      </dd>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-ink" data-numeric>
        {value}
      </dd>
    </div>
  );
}
