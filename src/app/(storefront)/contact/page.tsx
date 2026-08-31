import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ContactForm } from "@/components/marketing/contact-form";
import { Container, Eyebrow, GiltRule, Section } from "@/components/ui/primitives";
import { buildMetadata } from "@/lib/seo/metadata";
import { getSiteSettings, whatsappLink } from "@/lib/settings";

/**
 * Contact.
 *
 * Direct channels first — most questions are answered faster on WhatsApp than by
 * form. Contact details come from Site Settings, so they are changed in one place.
 */

export const revalidate = 3600;

export const metadata: Metadata = buildMetadata({
  title: "Contact Qalb Collections",
  description:
    "Questions about sizing, movement, condition or an order. WhatsApp, email, or send a message and we reply within one working day.",
  path: "/contact",
});

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const whatsapp = whatsappLink(
    settings.whatsappNumber,
    "Hello Qalb Collections — I have a question.",
  );

  return (
    <>
      <Breadcrumbs crumbs={[{ name: "Contact", path: "/contact" }]} />

      <header className="border-b border-line bg-shell">
        <Container className="py-16 sm:py-20">
          <div className="max-w-2xl">
            <Eyebrow className="text-qalb">Contact</Eyebrow>
            <h1 className="mt-5 text-display-lg text-ink">Need help choosing?</h1>
            <GiltRule className="mt-7" />
            <p className="mt-7 text-base leading-relaxed text-muted">
              Tell us what you are deciding between and we will give you an honest answer, including
              when the answer is that neither piece suits.
            </p>
          </div>
        </Container>
      </header>

      <Section spacing="default">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-24">
            <div>
              <h2 className="eyebrow border-b border-line pb-3 text-ink">Direct</h2>
              <ul className="mt-7 space-y-6">
                {whatsapp ? (
                  <li className="flex items-start gap-4">
                    <MessageCircle className="mt-0.5 size-4 shrink-0 text-gilt" strokeWidth={1.5} />
                    <div>
                      <p className="text-xs text-faint">WhatsApp — fastest</p>
                      <a
                        href={whatsapp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block text-sm text-ink"
                      >
                        <span className="link-sweep">
                          {settings.phoneDisplay || "Message us on WhatsApp"}
                        </span>
                      </a>
                    </div>
                  </li>
                ) : null}

                {settings.phoneDisplay ? (
                  <li className="flex items-start gap-4">
                    <Phone className="mt-0.5 size-4 shrink-0 text-gilt" strokeWidth={1.5} />
                    <div>
                      <p className="text-xs text-faint">Phone</p>
                      <p className="mt-1 text-sm text-ink" data-numeric>
                        {settings.phoneDisplay}
                      </p>
                    </div>
                  </li>
                ) : null}

                <li className="flex items-start gap-4">
                  <Mail className="mt-0.5 size-4 shrink-0 text-gilt" strokeWidth={1.5} />
                  <div>
                    <p className="text-xs text-faint">Email</p>
                    <a
                      href={`mailto:${settings.supportEmail}`}
                      className="mt-1 block text-sm text-ink"
                    >
                      <span className="link-sweep">{settings.supportEmail}</span>
                    </a>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-gilt" strokeWidth={1.5} />
                  <div>
                    <p className="text-xs text-faint">Based in</p>
                    <p className="mt-1 text-sm text-ink">{settings.addressLine}</p>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <Clock className="mt-0.5 size-4 shrink-0 text-gilt" strokeWidth={1.5} />
                  <div>
                    <p className="text-xs text-faint">Response time</p>
                    <p className="mt-1 text-sm text-ink">Within one working day</p>
                  </div>
                </li>
              </ul>

              <div className="mt-12 border-t border-line pt-8">
                <h2 className="eyebrow text-ink">Before you write</h2>
                <ul className="mt-5 space-y-3 text-sm leading-relaxed text-muted">
                  <li>
                    Delivery times and charges are set out in the{" "}
                    <Link
                      href="/shipping-policy"
                      className="underline decoration-line underline-offset-4 hover:decoration-ink"
                    >
                      shipping policy
                    </Link>
                    .
                  </li>
                  <li>
                    Returns and exchanges are covered in the{" "}
                    <Link
                      href="/returns-policy"
                      className="underline decoration-line underline-offset-4 hover:decoration-ink"
                    >
                      returns policy
                    </Link>
                    .
                  </li>
                  <li>
                    Not sure what suits you? Try{" "}
                    <Link
                      href="/find-your-timepiece"
                      className="underline decoration-line underline-offset-4 hover:decoration-ink"
                    >
                      Find your timepiece
                    </Link>
                    .
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h2 className="eyebrow border-b border-line pb-3 text-ink">Send a message</h2>
              <div className="mt-8">
                <ContactForm />
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
