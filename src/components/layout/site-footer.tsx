import Link from "next/link";

import { EmailCapture } from "@/components/marketing/email-capture";
import { Logo } from "@/components/layout/logo";
import { getSiteSettings } from "@/lib/settings";

const SHOP = [
  { label: "Watches", href: "/watches" },
  { label: "Collections", href: "/collections" },
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Perfumes", href: "/perfumes", badge: "COMING SOON" },
  { label: "Gift Guide", href: "/gift-guide" },
];

const CARE = [
  { label: "Contact Us", href: "/contact" },
  { label: "Shipping & Delivery", href: "/shipping" },
  { label: "Returns & Exchanges", href: "/returns" },
  { label: "FAQs", href: "/faqs" },
  { label: "Track Order", href: "/track-order" },
];

const ABOUT = [
  { label: "Our Story", href: "/about" },
  { label: "Authenticity", href: "/authenticity" },
  { label: "Journal", href: "/journal" },
  { label: "Care Guide", href: "/care-guide" },
];

const LEGAL = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Refund Policy", href: "/refund-policy" },
];

/**
 * Footer matching the reference.
 *
 * Five columns: brand + socials, shop, customer care, about, newsletter.
 * Thin champagne divider and a bottom bar with copyright and legal links.
 */
export async function SiteFooter() {
  const settings = await getSiteSettings();
  const year = new Date().getFullYear();

  const socials = [
    { label: "Instagram", href: settings.instagramUrl, icon: InstagramIcon },
    { label: "Facebook", href: settings.facebookUrl, icon: FacebookIcon },
    { label: "TikTok", href: settings.tiktokUrl, icon: TikTokIcon },
  ].filter((s) => s.href?.length > 0);

  function InstagramIcon({ className }: { className?: string }) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className} aria-hidden>
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="18" cy="6" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  function FacebookIcon({ className }: { className?: string }) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }

  function TikTokIcon({ className }: { className?: string }) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z" />
      </svg>
    );
  }

  return (
    <footer className="bg-void text-warm-white/60">
      <div aria-hidden className="h-px bg-champ/15" />

      <div className="shell-x mx-auto max-w-[1320px] py-16 sm:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.5fr]">
          {/* Brand column */}
          <div>
            <Logo tone="void" />
            <p className="mt-5 max-w-[18ch] text-[0.9375rem] leading-relaxed text-warm-white/55">
              Crafted in detail.<br />Delivered across Pakistan.
            </p>
            <div className="mt-6 flex gap-4">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  rel="noopener noreferrer"
                  target="_blank"
                  aria-label={social.label}
                  className="text-warm-white/45 transition-colors duration-300 hover:text-warm-white"
                >
                  <social.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-champ">Shop</h3>
            <ul className="mt-5 space-y-3">
              {SHOP.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-2 text-[0.9375rem] text-warm-white/80 transition-colors duration-300 hover:text-warm-white"
                  >
                    {link.label}
                    {link.badge ? (
                      <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-champ">{link.badge}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-champ">Customer care</h3>
            <ul className="mt-5 space-y-3">
              {CARE.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[0.9375rem] text-warm-white/80 transition-colors duration-300 hover:text-warm-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-champ">About</h3>
            <ul className="mt-5 space-y-3">
              {ABOUT.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[0.9375rem] text-warm-white/80 transition-colors duration-300 hover:text-warm-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-champ">Newsletter</h3>
            <p className="mt-5 max-w-[28ch] text-[0.9375rem] leading-relaxed text-warm-white/80">
              Be the first to discover new collections and exclusive offers.
            </p>
            <div className="mt-5">
              <EmailCapture
                tone="dark"
                variant="boxed"
                source="footer"
                ctaLabel=""
                placeholder="Email address"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-warm-white/10">
        <div className="shell-x mx-auto flex max-w-[1320px] flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.75rem] text-warm-white/40">
            © {year} {settings.brandName}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[0.75rem] text-warm-white/40">
            {LEGAL.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors duration-300 hover:text-warm-white/70"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
