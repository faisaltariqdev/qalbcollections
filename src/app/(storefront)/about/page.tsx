import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, MapPin, MessageCircle } from "lucide-react";

import { FaqAccordion } from "@/components/content/faq-accordion";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { JsonLdGraph } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { Container, Divider, Eyebrow, GiltRule, Section } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";
import { buildMetadata } from "@/lib/seo/metadata";
import { faqSchema } from "@/lib/seo/structured-data";
import { getSiteSettings, whatsappLink } from "@/lib/settings";
import { TRUST_POINTS } from "@/server/trust";

/**
 * About.
 *
 * The page a careful shopper — and a language model summarising the brand —
 * reads to decide whether this is a real business. It states plainly who we are,
 * what we sell, how we operate and what we do not claim. Everything here is
 * verifiable against the rest of the site.
 */

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "About Qalb Collections",
  description:
    "Qalb Collections is a Pakistan-based curator of premium watches. What we sell, how we source and describe it, how delivery and returns work, and what we do not claim.",
  path: "/about",
});

const PRINCIPLES = [
  {
    title: "Curated, not catalogued",
    body: "We would rather list four watches we can speak about in detail than four hundred we cannot. Every piece is selected, photographed and written up by the same small team.",
  },
  {
    title: "One description, no theatre",
    body: "Specifications come from the piece in front of us. Where a figure is unverified, it is left out rather than filled in. No invented heritage, no borrowed marketing copy.",
  },
  {
    title: "Photographs of the actual stock",
    body: "The images on a product page show the piece you will receive, shot by us. We do not use supplier renders or stock photography of a different reference.",
  },
  {
    title: "The price is the price",
    body: "No permanent fake discount, no countdown timers, no invented recommended retail figure to strike through. When something is reduced, it was sold at the higher price first.",
  },
];

export default async function AboutPage() {
  const settings = await getSiteSettings();
  const whatsapp = whatsappLink(
    settings.whatsappNumber,
    "Hello Qalb Collections — I have a question.",
  );

  const faqs = [
    {
      question: "What does Qalb Collections sell?",
      answer:
        "Premium watches, curated in small numbers. Qalb Perfumes is in development and is not yet available to buy. Jewellery, sunglasses and accessories may follow.",
    },
    {
      question: "Where is Qalb Collections based?",
      answer: `${settings.addressLine}. Orders are dispatched from Pakistan and delivered nationwide, typically in ${settings.shippingLeadTime}.`,
    },
    {
      question: "How can I pay?",
      answer:
        "Cash on delivery anywhere in Pakistan, or bank transfer in advance. Card payment will be added when it can be offered securely.",
    },
    {
      question: "Can I return a watch?",
      answer: `Yes — an unworn piece can be returned within ${settings.returnsWindowDays} days of delivery, complete with its box and tags. Raise the return with us first so it can be matched to your order.`,
    },
  ];

  return (
    <>
      <Breadcrumbs crumbs={[{ name: "About", path: "/about" }]} />

      {/* Statement */}
      <Section tone="canvas" spacing="loose">
        <Container>
          <div className="max-w-3xl">
            <Eyebrow className="text-qalb">About</Eyebrow>
            <h1 className="mt-7 font-display text-[clamp(2.25rem,6vw,4.5rem)] font-light leading-[1.02] tracking-[-0.02em] text-ink">
              Time is personal.
            </h1>
            <GiltRule className="mt-9 w-24" />
            <p className="mt-9 text-lg leading-relaxed text-muted">
              Qalb Collections is a Pakistan-based curator of premium watches. <em>Qalb</em> means
              heart — the thing that keeps time without being asked to. It is the right word for a
              business built around a small number of objects chosen carefully.
            </p>
            <p className="mt-6 max-w-2xl text-base leading-loose text-muted">
              We are not a marketplace and we are not a reseller of everything. We hold a short list
              of watches, we know each one, and we answer questions about them ourselves.
            </p>
          </div>
        </Container>
      </Section>

      {/* Editorial image + the work */}
      <Section tone="shell">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
            <Reveal>
              <div className="relative aspect-4/5 overflow-hidden bg-shell-deep">
                <Image
                  src="/media/lookbook/tag-heuer-carrera-hero.jpg"
                  alt="Macro photograph of an automatic Carrera dial showing applied indices and the second-time-zone hand"
                  fill
                  quality={90}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </Reveal>

            <div>
              <Eyebrow className="text-qalb">What we do</Eyebrow>
              <h2 className="mt-5 text-display-md text-ink">
                Fewer pieces, described properly
              </h2>
              <GiltRule className="mt-7" />
              <p className="mt-8 text-base leading-loose text-muted">
                Buying a watch online usually means reading a specification sheet copied from
                somewhere else, next to a photograph of a different unit. We built this the other way
                round: the photographs are of the stock, the specifications are checked, and the
                writing explains what the numbers mean for wearing it.
              </p>
              <p className="mt-5 text-base leading-loose text-muted">
                That approach limits how fast the catalogue can grow. We think that is the right
                trade.
              </p>
              <Button asChild variant="secondary" className="mt-9">
                <Link href="/watches">
                  See the catalogue <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      {/* Principles */}
      <Section tone="canvas">
        <Container>
          <div className="max-w-2xl">
            <Eyebrow className="text-qalb">How we work</Eyebrow>
            <h2 className="mt-5 text-display-md text-ink">Four rules we hold ourselves to</h2>
            <GiltRule className="mt-7" />
          </div>

          <div className="mt-16 grid gap-x-14 gap-y-12 md:grid-cols-2">
            {PRINCIPLES.map((principle, index) => (
              <Reveal key={principle.title} delay={index * 80}>
                <div className="border-t border-line pt-7">
                  <p className="eyebrow text-[0.5625rem] text-faint" data-numeric>
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-4 font-display text-2xl text-ink">{principle.title}</h3>
                  <p className="mt-4 text-sm leading-loose text-muted">{principle.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </Section>

      {/* What you can expect — same source as the homepage trust block */}
      <Section tone="obsidian">
        <Container>
          <div className="max-w-2xl">
            <Eyebrow className="text-gilt">Commitments</Eyebrow>
            <h2 className="mt-5 font-display text-[clamp(1.75rem,4vw,3rem)] font-light leading-[1.08] text-canvas">
              What you can expect from us
            </h2>
            <p className="mt-7 text-sm leading-loose text-canvas/60">
              Only claims we can substantiate. You will not find certifications, awards, years in
              business or customer counts on this site, because none have been established yet.
            </p>
          </div>

          <div className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST_POINTS.map((point) => (
              <div key={point.title} className="border-t border-canvas/15 pt-6">
                <h3 className="font-display text-xl text-canvas">{point.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-canvas/60">{point.body}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Facts + contact — the section an AI summariser should find easy */}
      <Section tone="canvas">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-24">
            <div>
              <Eyebrow className="text-qalb">The details</Eyebrow>
              <h2 className="mt-5 text-display-sm text-ink">Business information</h2>
              <GiltRule className="mt-7" />

              <dl className="mt-9">
                {[
                  { label: "Trading name", value: settings.brandName },
                  { label: "Category", value: "Premium watches. Perfumes in development." },
                  { label: "Based in", value: settings.addressLine },
                  { label: "Delivery", value: `Nationwide, ${settings.shippingLeadTime}` },
                  { label: "Payment", value: "Cash on delivery, bank transfer" },
                  { label: "Returns", value: `${settings.returnsWindowDays} days, unworn` },
                  { label: "Currency", value: settings.currency },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between gap-6 border-b border-line-soft py-3.5"
                  >
                    <dt className="text-xs text-muted">{row.label}</dt>
                    <dd className="text-right text-sm text-ink">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div>
              <Eyebrow className="text-qalb">Talk to us</Eyebrow>
              <h2 className="mt-5 text-display-sm text-ink">
                Ask before you buy, not after
              </h2>
              <GiltRule className="mt-7" />
              <p className="mt-8 text-base leading-loose text-muted">
                Sizing, movement, condition, whether a piece suits a particular wrist — these are
                worth a conversation. We would rather talk you out of the wrong watch than process a
                return.
              </p>

              <ul className="mt-9 space-y-4">
                {whatsapp ? (
                  <li>
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-3 text-sm text-ink"
                    >
                      <MessageCircle className="size-4 text-gilt" strokeWidth={1.5} />
                      <span className="link-sweep">WhatsApp {settings.phoneDisplay}</span>
                    </a>
                  </li>
                ) : null}
                <li>
                  <a
                    href={`mailto:${settings.supportEmail}`}
                    className="group inline-flex items-center gap-3 text-sm text-ink"
                  >
                    <Mail className="size-4 text-gilt" strokeWidth={1.5} />
                    <span className="link-sweep">{settings.supportEmail}</span>
                  </a>
                </li>
                <li className="inline-flex items-center gap-3 text-sm text-muted">
                  <MapPin className="size-4 text-gilt" strokeWidth={1.5} />
                  {settings.addressLine}
                </li>
              </ul>

              <Divider className="my-9" />

              <div className="flex flex-wrap gap-3">
                <Button asChild variant="primary">
                  <Link href="/contact">Contact us</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/find-your-timepiece">Find your timepiece</Link>
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section tone="shell" spacing="tight">
        <Container size="narrow">
          <Eyebrow className="text-qalb">Common questions</Eyebrow>
          <h2 className="mt-5 text-display-sm text-ink">The short answers</h2>
          <GiltRule className="mt-7" />
          <FaqAccordion faqs={faqs} className="mt-10 border-t border-line" />
        </Container>
      </Section>

      <JsonLdGraph items={[faqSchema(faqs)]} />
    </>
  );
}
