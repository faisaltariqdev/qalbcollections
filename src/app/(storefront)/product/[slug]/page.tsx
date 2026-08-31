import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Banknote, Check, MessageCircle, Package, RotateCcw, ShieldCheck, Truck } from "lucide-react";

import { TrackEvent } from "@/components/analytics/track-event";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { CompareToggle } from "@/components/product/compare-tray";
import { ProductGallery } from "@/components/product/gallery";
import { HowToBuy } from "@/components/product/how-to-buy";
import { Price } from "@/components/product/price";
import { FaqAccordion } from "@/components/content/faq-accordion";
import { ProductHighlights } from "@/components/product/product-highlights";
import { ProductPanels } from "@/components/product/product-panels";
import { ProductSectionNav } from "@/components/product/product-section-nav";
import { ProductGrid } from "@/components/product/product-card";
import { RecordProductView } from "@/components/product/recently-viewed";
import { RecentlyViewedRail } from "@/components/product/recently-viewed-rail";
import { Specifications } from "@/components/product/specifications";
import { StickyBuyBar } from "@/components/product/sticky-buy-bar";
import { WishlistButton } from "@/components/product/wishlist-button";
import { JsonLdGraph } from "@/components/seo/json-ld";
import { Badge, Container, Eyebrow, GiltRule, Section } from "@/components/ui/primitives";
import { Markdown } from "@/lib/markdown";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { categoryPath } from "@/lib/routes";
import { buildMetadata } from "@/lib/seo/metadata";
import { faqSchema, howToBuySchema, productSchema } from "@/lib/seo/structured-data";
import { getSiteSettings, whatsappLink } from "@/lib/settings";
import { getCollectionCompanions, getProductBySlug, getRelatedProducts } from "@/server/catalog";

/**
 * Product detail — gallery-led atelier page.
 *
 * One H1 (brand + name), sticky purchase on mobile, jump links for specs and
 * FAQs, and HowTo / Product JSON-LD so the listing is both usable and crawlable.
 */

export const revalidate = 300;

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const products = await db.product.findMany({
    where: { status: "ACTIVE" },
    select: { slug: true },
  });
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Piece not found" };

  const title = product.seo.title ?? `${product.brand} ${product.name}`;
  const warranty = product.specifications.find((row) => row.key === "warranty")?.value;
  const movement = product.specifications.find((row) => row.key === "movement")?.value;
  const caseSize = product.specifications.find((row) => row.key === "case-size")?.value;

  const fallbackDescription = [
    `${product.brand} ${product.name} at Qalb Collections.`,
    product.shortDescription,
    movement ? `${movement} movement.` : null,
    caseSize ? `${caseSize} mm case.` : null,
    warranty ? `${warranty}.` : null,
    "Photographed as the piece you receive. Boxed, warrantied and delivered across Pakistan. Cash on delivery available.",
  ]
    .filter(Boolean)
    .join(" ");

  return buildMetadata({
    title,
    description: product.seo.description ?? fallbackDescription,
    path: `/product/${product.slug}`,
    canonicalPath: product.seo.canonicalUrl ?? undefined,
    image: product.seo.ogImageUrl ?? product.primaryImage?.url ?? null,
    imageAlt: product.primaryImage?.alt ?? `${product.brand} ${product.name}`,
    noIndex: product.seo.noIndex,
    type: "product",
  });
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [settings, related, companions] = await Promise.all([
    getSiteSettings(),
    getRelatedProducts(product),
    getCollectionCompanions(product),
  ]);

  const warranty = product.specifications.find((row) => row.key === "warranty")?.value;

  const panels = [
    {
      id: "delivery",
      title: "Delivery across Pakistan",
      body: `Packed within one working day and delivered in ${settings.shippingLeadTime}.\nYou receive a tracking reference once the parcel is collected. Cash-on-delivery orders are confirmed by phone before dispatch.`,
    },
    {
      id: "returns",
      title: "Returns & exchanges",
      body: `Return an unworn piece within ${settings.returnsWindowDays} days of delivery, complete with its box and tags.\nRaise the return with us first so we can track it to your order. Faults and warranty claims are handled separately and at our cost.`,
    },
    {
      id: "authenticity",
      title: "Condition & warranty",
      body: warranty
        ? `This piece is covered by ${warranty.toLowerCase()}, running from the date of delivery and covering the movement against manufacturing defect.\nBatteries, straps, bracelets, crystals and water damage beyond the stated resistance are not covered. Every piece is described exactly as it is, and photographed as the stock you will receive.`
        : "Every piece is described exactly as it is and photographed as the stock you will receive. If you have a question about condition before buying, ask us and we will answer it plainly.",
    },
  ];

  const whatsapp = whatsappLink(
    settings.whatsappNumber,
    `Hello Qalb Collections — I'd like to ask about the ${product.brand} ${product.name} (${product.sku}).`,
  );

  const trustItems = [
    { icon: ShieldCheck, label: warranty ? warranty.split(",")[0] : "Warranty included" },
    { icon: Truck, label: `Delivery in ${settings.shippingLeadTime}` },
    { icon: RotateCcw, label: `${settings.returnsWindowDays}-day returns` },
    { icon: Banknote, label: "Cash on delivery" },
  ];

  const cartProduct = {
    id: product.id,
    name: product.name,
    brand: product.brand,
    price: product.price,
    currency: product.currency,
    category: product.category.name,
    inStock: product.inStock,
    comingSoon: product.comingSoon,
  };

  const sectionIds = [
    "overview",
    "how-to-buy",
    product.story ? "story" : null,
    product.specifications.length > 0 || product.description ? "specifications" : null,
    product.faqs.length > 0 ? "faq" : null,
  ].filter((id): id is string => Boolean(id));

  return (
    <>
      <RecordProductView productId={product.id} />
      <TrackEvent
        name="product_view"
        payload={{
          item: {
            id: product.id,
            name: product.name,
            brand: product.brand,
            category: product.category.name,
            price: product.price,
            currency: product.currency,
          },
        }}
      />

      <Breadcrumbs
        className="bg-nav"
        crumbs={[
          { name: "Shop", path: "/shop" },
          { name: product.category.name, path: categoryPath(product.category.slug) },
          { name: `${product.brand} ${product.name}`, path: `/product/${product.slug}` },
        ]}
      />

      <article itemScope itemType="https://schema.org/Product">
        <meta itemProp="sku" content={product.sku} />
        <meta itemProp="brand" content={product.brand} />
        {product.primaryImage ? (
          <link itemProp="image" href={product.primaryImage.url} />
        ) : null}

        <section id="overview" className="scroll-mt-36 bg-nav">
          <Container className="pb-16 pt-2 lg:pb-24 lg:pt-4">
            <div className="grid gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)] lg:items-start lg:gap-16 xl:gap-20">
              <div className="lg:sticky lg:top-32 lg:self-start">
                <ProductGallery
                  images={product.images}
                  productName={`${product.brand} ${product.name}`}
                />
              </div>

              <div className="flex flex-col lg:pt-1">
                {product.badges.length > 0 ? (
                  <div className="mb-5 flex flex-wrap gap-2">
                    {product.badges.map((badge) => (
                      <Badge key={badge.label} tone={badge.tone}>
                        {badge.label}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                <p className="eyebrow text-burgundy">{product.category.name}</p>
                <h1
                  itemProp="name"
                  className="mt-3 font-display text-[clamp(2rem,4.6vw,3.35rem)] font-normal leading-[1.06] tracking-[-0.02em] text-ink"
                >
                  {product.brand}
                  <span className="mt-1 block font-normal">{product.name}</span>
                </h1>
                <div className="diamond-rule mt-5 max-w-[7rem]" aria-hidden>
                  <span />
                </div>

                <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
                  <Price
                    price={product.price}
                    compareAtPrice={product.compareAtPrice}
                    currency={product.currency}
                    size="lg"
                    showSaving
                  />
                  {product.comingSoon ? (
                    <span className="eyebrow text-burgundy">Not yet released</span>
                  ) : product.inStock ? (
                    <span className="inline-flex items-center gap-1.5 border border-success/30 bg-success/10 px-2.5 py-1 text-xs text-success">
                      <Check className="size-3.5" strokeWidth={2.5} />
                      {product.lowStock ? `Only ${product.stock} left` : "Ready to ship"}
                    </span>
                  ) : (
                    <span className="text-xs text-dust">Currently sold out</span>
                  )}
                </div>

                <ProductHighlights rows={product.specifications} />

                {product.shortDescription ? (
                  <p itemProp="description" className="mt-7 max-w-lg text-[0.975rem] leading-[1.85] text-ink-soft">
                    {product.shortDescription}
                  </p>
                ) : null}

                {product.variants.length > 0 ? (
                  <div className="mt-8">
                    <p className="eyebrow text-dust">{product.variants[0]!.name}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {product.variants.map((variant) => (
                        <span
                          key={variant.id}
                          className="border border-ink/20 bg-cream px-4 py-2.5 text-sm text-ink"
                        >
                          {variant.value}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="mt-9 border border-champ/30 bg-cream/40 p-5 sm:p-6">
                  <div className="flex gap-3">
                    <AddToCartButton product={cartProduct} className="h-14 flex-1" />
                    <WishlistButton
                      productId={product.id}
                      productName={product.name}
                      variant="inline"
                      className="size-14 border-ink/20"
                    />
                  </div>

                  {whatsapp ? (
                    <a
                      href={whatsapp}
                      rel="noopener noreferrer"
                      target="_blank"
                      className="mt-3 flex h-12 items-center justify-center gap-2 border border-burgundy text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-burgundy transition-colors hover:bg-burgundy hover:text-nav"
                    >
                      <MessageCircle className="size-4" strokeWidth={1.5} />
                      Ask about this piece
                    </a>
                  ) : (
                    <Link
                      href="/contact"
                      className="mt-3 flex h-12 items-center justify-center gap-2 border border-burgundy text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-burgundy transition-colors hover:bg-burgundy hover:text-nav"
                    >
                      <MessageCircle className="size-4" strokeWidth={1.5} />
                      Ask about this piece
                    </Link>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <CompareToggle productId={product.id} />
                    <p className="text-[0.6875rem] text-dust" data-numeric>
                      Reference {product.sku}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-[0.75rem] leading-relaxed text-dust">
                  {formatMoney(product.price, product.currency)} includes what you see. Cash on
                  delivery and bank transfer at checkout. Packed with{" "}
                  <Package className="inline size-3.5 align-[-2px] text-champ" strokeWidth={1.5} />{" "}
                  the original box.
                </p>

                <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-ink/10 bg-ink/10 sm:grid-cols-4">
                  {trustItems.map((item) => (
                    <div key={item.label} className="flex flex-col items-start gap-2 bg-nav px-3 py-4">
                      <item.icon className="size-5 text-champ" strokeWidth={1.5} />
                      <span className="text-[0.6875rem] leading-snug text-ink-soft">{item.label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <ProductPanels panels={panels} />
                </div>
              </div>
            </div>
          </Container>
        </section>

        <ProductSectionNav available={sectionIds} />

        <HowToBuy />

        {product.story ? (
          <Section id="story" tone="cream" className="scroll-mt-36">
            <Container size="narrow">
              <Eyebrow className="text-burgundy">The story</Eyebrow>
              <h2 className="mt-5 font-display text-[clamp(1.75rem,4vw,2.75rem)] font-normal leading-[1.1] tracking-[-0.02em] text-ink">
                Why this one
              </h2>
              <GiltRule className="mt-7" />
              <Markdown content={product.story} className="prose-qalb mt-8" />
            </Container>
          </Section>
        ) : null}

        {product.specifications.length > 0 || product.description ? (
          <Section id="specifications" tone="ivory" className="scroll-mt-36">
            <Container>
              {product.specifications.length > 0 ? (
                <>
                  <Eyebrow className="text-burgundy">The detail</Eyebrow>
                  <h2 className="mt-4 font-display text-[clamp(1.75rem,4vw,2.75rem)] font-normal text-ink">
                    Specifications
                  </h2>
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-dust">
                    Declared attributes only — if a fact is not here, we have not claimed it.
                  </p>
                  <div className="mt-12">
                    <Specifications rows={product.specifications} />
                  </div>
                </>
              ) : null}

              {product.description ? (
                <div className={product.specifications.length > 0 ? "mt-16" : undefined}>
                  <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)]">
                    <h2 className="eyebrow text-burgundy">In more detail</h2>
                    <Markdown content={product.description} className="prose-qalb" />
                  </div>
                </div>
              ) : null}
            </Container>
          </Section>
        ) : null}

        {product.faqs.length > 0 ? (
          <Section id="faq" tone="cream" spacing="tight" className="scroll-mt-36">
            <Container size="narrow">
              <Eyebrow className="text-burgundy">Before you buy</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(1.75rem,4vw,2.75rem)] font-normal text-ink">
                Frequently asked
              </h2>
              <div className="mt-10">
                <FaqAccordion faqs={product.faqs} />
              </div>
            </Container>
          </Section>
        ) : null}

        {companions.length > 0 ? (
          <Section tone="void">
            <Container>
              <Eyebrow className="text-champ">From the same edit</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(1.75rem,4vw,2.75rem)] font-normal text-warm-white">
                Complete the collection
              </h2>
              <div className="mt-10">
                <ProductGrid products={companions} columns={3} size="compact" />
              </div>
            </Container>
          </Section>
        ) : null}

        {related.length > 0 ? (
          <Section tone="cream" spacing="tight">
            <Container>
              <Eyebrow className="text-burgundy">You may also consider</Eyebrow>
              <h2 className="mt-4 font-display text-[clamp(1.75rem,4vw,2.75rem)] font-normal text-ink">
                Related pieces
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-dust">
                Similar proportion, finishing or brand — chosen so you can compare before you decide.
              </p>
              <div className="mt-10">
                <ProductGrid products={related} columns={4} size="compact" />
              </div>
            </Container>
          </Section>
        ) : null}
      </article>

      <RecentlyViewedRail excludeId={product.id} />
      <StickyBuyBar product={cartProduct} price={product.price} currency={product.currency} />

      <JsonLdGraph
        items={[
          productSchema({
            name: `${product.brand} ${product.name}`,
            slug: product.slug,
            brand: product.brand,
            sku: product.sku,
            description: product.description ?? product.shortDescription ?? product.name,
            images: product.images.map((image) => image.url),
            price: product.price,
            currency: product.currency,
            inStock: product.inStock,
            comingSoon: product.comingSoon,
            category: product.category.name,
            attributes: product.specifications.map((row) => ({
              label: row.label,
              value: row.value,
            })),
            reviews: product.reviews,
            returnsWindowDays: settings.returnsWindowDays,
          }),
          faqSchema(product.faqs),
          howToBuySchema(),
        ]}
      />
    </>
  );
}
