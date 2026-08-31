import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";

import { TrackEvent } from "@/components/analytics/track-event";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Logo } from "@/components/layout/logo";
import { Container, Divider, Eyebrow, GiltRule } from "@/components/ui/primitives";
import { getCustomerIdentity } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import { availablePaymentProviders } from "@/lib/payments";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteSettings } from "@/lib/settings";
import { getCart } from "@/server/cart";

/**
 * Checkout.
 *
 * Deliberately outside the storefront chrome: no navigation, no search, no
 * cross-sell. The only routes out are the logo and the bag.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Checkout",
  description: "Complete your Qalb Collections order.",
  path: "/checkout",
  noIndex: true,
});

export default async function CheckoutPage() {
  const [cart, settings, customer] = await Promise.all([
    getCart(),
    getSiteSettings(),
    getCustomerIdentity(),
  ]);

  if (cart.lines.length === 0) redirect("/cart");

  const providers = availablePaymentProviders({
    currency: cart.currency,
    amount: cart.totals.total,
  });

  const { totals, currency } = cart;

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="border-b border-line">
        <Container className="flex h-20 items-center justify-between">
          <Link href="/" aria-label="Qalb Collections — home">
            <Logo size="sm" />
          </Link>
          <Link
            href="/cart"
            className="eyebrow text-[0.5625rem] text-muted transition-colors hover:text-ink"
          >
            Back to bag
          </Link>
        </Container>
      </header>

      <Container className="py-12 lg:py-16">
        <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_23rem] lg:gap-24">
          <div className="min-w-0">
            <Eyebrow className="text-qalb">Checkout</Eyebrow>
            <h1 className="mt-5 text-display-md text-ink">Complete your order</h1>
            <GiltRule className="mt-7" />
            <p className="mt-7 max-w-xl text-sm leading-relaxed text-muted">
              {customer
                ? `Signed in as ${customer.email}. This order will appear in your account.`
                : "No account needed to order."}
            </p>

            {customer ? null : (
              <p className="mt-4 text-sm text-muted">
                Have an account?{" "}
                <Link
                  href="/sign-in?next=/checkout"
                  className="text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
                >
                  Sign in
                </Link>{" "}
                and your details are filled in for you.
              </p>
            )}

            <div className="mt-12">
              <CheckoutForm
                methods={providers.map((provider) => ({
                  id: provider.id,
                  label: provider.label,
                  description: provider.description,
                }))}
                currency={currency}
                total={totals.total}
                itemCount={totals.itemCount}
                defaults={{
                  name: customer?.name ?? "",
                  email: customer?.email ?? "",
                  phone: "",
                }}
              />
            </div>
          </div>

          {/* Order summary */}
          <aside className="lg:sticky lg:top-10 lg:self-start">
            <div className="border border-line bg-shell p-7">
              <h2 className="eyebrow text-ink">Your order</h2>

              <ul className="mt-7 space-y-5">
                {cart.lines.map((line) => (
                  <li key={line.id} className="flex gap-4">
                    <div className="relative aspect-4/5 w-14 shrink-0 overflow-hidden bg-canvas">
                      {line.imageUrl ? (
                        <Image
                          src={line.imageUrl}
                          alt={line.imageAlt}
                          fill
                          sizes="56px"
                          quality={75}
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted">{line.brand}</p>
                      <p className="mt-0.5 truncate text-sm text-ink">{line.name}</p>
                      <p className="mt-1 text-xs text-faint" data-numeric>
                        Qty {line.quantity}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm text-ink" data-numeric>
                      {formatMoney(line.lineTotal, currency)}
                    </p>
                  </li>
                ))}
              </ul>

              <Divider className="my-7" />

              <dl className="space-y-3.5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="text-ink" data-numeric>
                    {formatMoney(totals.subtotal, currency)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Delivery</dt>
                  <dd className="text-ink" data-numeric>
                    {totals.shippingTotal === 0
                      ? "Complimentary"
                      : formatMoney(totals.shippingTotal, currency)}
                  </dd>
                </div>
                {totals.taxTotal > 0 ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Tax</dt>
                    <dd className="text-ink" data-numeric>
                      {formatMoney(totals.taxTotal, currency)}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-6 flex items-baseline justify-between border-t border-line pt-5">
                <span className="eyebrow text-ink">Total</span>
                <span className="font-display text-2xl text-ink" data-numeric>
                  {formatMoney(totals.total, currency)}
                </span>
              </div>

              <p className="mt-6 flex items-start gap-2.5 text-xs leading-relaxed text-muted">
                <Lock className="mt-px size-3.5 shrink-0 text-gilt" strokeWidth={1.5} />
                We never ask for card details. Delivery in {settings.shippingLeadTime}, with{" "}
                {settings.returnsWindowDays} days to return an unworn piece.
              </p>
            </div>
          </aside>
        </div>
      </Container>

      <TrackEvent
        name="checkout_start"
        payload={{ value: totals.total, currency, itemCount: totals.itemCount }}
      />
    </div>
  );
}
