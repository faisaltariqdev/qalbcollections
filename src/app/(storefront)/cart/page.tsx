import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock, ShoppingBag, Truck } from "lucide-react";

import { CartLines } from "@/components/cart/cart-lines";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductGrid } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { Container, EmptyState, Eyebrow, Section } from "@/components/ui/primitives";
import { formatMoney } from "@/lib/money";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteSettings } from "@/lib/settings";
import { listCurated } from "@/server/catalog";
import { getCart } from "@/server/cart";

/**
 * Bag — cream atelier page with a dark, high-contrast summary.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Your bag",
  description: "Review the pieces in your bag before checking out.",
  path: "/cart",
  noIndex: true,
});

export default async function CartPage() {
  const [cart, settings] = await Promise.all([getCart(), getSiteSettings()]);

  if (cart.lines.length === 0) {
    const suggestions = await listCurated("featured", 4);

    return (
      <>
        <Breadcrumbs className="bg-nav" crumbs={[{ name: "Bag", path: "/cart" }]} />

        <section className="bg-nav py-16 sm:py-20">
          <Container>
            <p className="eyebrow text-burgundy">Your bag</p>
            <h1 className="mt-4 font-display text-[clamp(2.25rem,5vw,3.5rem)] font-medium text-ink">
              Nothing here yet
            </h1>
            <div className="diamond-rule mt-6 max-w-[7rem]" aria-hidden>
              <span />
            </div>

            <EmptyState
              className="mt-10 border-ink/10 bg-cream/70"
              icon={<ShoppingBag className="size-10 text-burgundy" strokeWidth={1.25} />}
              title="Add a piece to continue"
              description="Pieces you add wait here. Nothing is reserved until you place the order."
              actions={
                <>
                  <Button asChild variant="primary" size="lg">
                    <Link href="/watches">Explore watches</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/find-your-timepiece">Find your timepiece</Link>
                  </Button>
                </>
              }
            />
          </Container>
        </section>

        {suggestions.length > 0 ? (
          <Section tone="void" spacing="tight">
            <Container>
              <Eyebrow className="text-champ">Start here</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(1.75rem,4vw,2.75rem)] font-medium text-warm-white">
                Currently curated
              </h2>
              <div className="mt-10">
                <ProductGrid products={suggestions} columns={4} size="compact" />
              </div>
            </Container>
          </Section>
        ) : null}
      </>
    );
  }

  const { totals, currency } = cart;

  return (
    <>
      <Breadcrumbs className="bg-nav" crumbs={[{ name: "Bag", path: "/cart" }]} />

      <section className="bg-nav pb-28 pt-6 lg:pb-24">
        <Container>
          <header className="flex flex-wrap items-end justify-between gap-6 border-b border-ink/10 pb-8">
            <div>
              <p className="eyebrow text-burgundy">Your bag</p>
              <h1 className="mt-3 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-medium leading-none text-ink">
                {totals.itemCount} {totals.itemCount === 1 ? "piece" : "pieces"}
              </h1>
            </div>
            <Link
              href="/watches"
              className="text-base font-medium text-burgundy underline decoration-burgundy/30 underline-offset-4 transition-colors hover:decoration-burgundy"
            >
              Continue browsing
            </Link>
          </header>

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-14">
            <CartLines lines={cart.lines} />

            <aside className="lg:sticky lg:top-28">
              <div className="border border-champ/30 bg-void p-7 text-nav sm:p-8">
                <h2 className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-champ">
                  Order summary
                </h2>

                <dl className="mt-7 space-y-4 text-[0.9375rem]">
                  <Row label="Subtotal" value={formatMoney(totals.subtotal, currency)} />
                  <Row
                    label="Delivery"
                    value={
                      totals.shippingTotal === 0
                        ? "Complimentary"
                        : formatMoney(totals.shippingTotal, currency)
                    }
                  />
                  {totals.taxTotal > 0 ? (
                    <Row label="Tax" value={formatMoney(totals.taxTotal, currency)} />
                  ) : null}
                </dl>

                <div className="mt-6 flex items-baseline justify-between border-t border-champ/25 pt-5">
                  <span className="text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-champ">
                    Total
                  </span>
                  <span className="font-display text-[1.75rem] font-medium text-nav" data-numeric>
                    {formatMoney(totals.total, currency)}
                  </span>
                </div>

                {cart.freeShippingRemaining !== null ? (
                  <p className="mt-5 text-sm leading-relaxed text-nav/70">
                    Add {formatMoney(cart.freeShippingRemaining, currency)} more for complimentary
                    delivery.
                  </p>
                ) : (
                  <p className="mt-5 text-sm leading-relaxed text-nav/70">
                    Delivery is complimentary on this order.
                  </p>
                )}

                <Button asChild size="lg" variant="secondary" block className="mt-8">
                  <Link href="/checkout">
                    Checkout
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>

                <ul className="mt-8 space-y-3.5 border-t border-champ/20 pt-6">
                  <li className="flex items-start gap-3 text-sm text-nav/80">
                    <Truck className="mt-0.5 size-4 shrink-0 text-champ" strokeWidth={1.5} />
                    Delivered in {settings.shippingLeadTime}
                  </li>
                  <li className="flex items-start gap-3 text-sm text-nav/80">
                    <Lock className="mt-0.5 size-4 shrink-0 text-champ" strokeWidth={1.5} />
                    Cash on delivery or bank transfer
                  </li>
                </ul>
              </div>

              <p className="mt-5 text-sm leading-relaxed text-dust">
                Prices and availability are confirmed when you place the order. Nothing is reserved
                while it sits in your bag.
              </p>
            </aside>
          </div>
        </Container>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-champ/40 bg-void px-4 py-3 lg:hidden">
          <div className="mx-auto flex max-w-[1320px] items-center gap-3">
            <div className="min-w-0">
              <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-champ">
                Total
              </p>
              <p className="font-display text-xl font-medium leading-tight text-nav" data-numeric>
                {formatMoney(totals.total, currency)}
              </p>
            </div>
            <Button asChild size="md" variant="secondary" className="ml-auto min-w-[10rem]">
              <Link href="/checkout">
                Checkout
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-nav/80">{label}</dt>
      <dd className="font-medium text-nav" data-numeric>
        {value}
      </dd>
    </div>
  );
}
