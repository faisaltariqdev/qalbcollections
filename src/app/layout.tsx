import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { Toaster } from "@/components/providers/toaster";
import { JsonLdGraph } from "@/components/seo/json-ld";
import { siteUrl } from "@/lib/env";
import { BRAND, DEFAULT_OG_IMAGE } from "@/lib/seo/metadata";
import { organizationSchema, websiteSchema } from "@/lib/seo/structured-data";
import { getSiteSettings } from "@/lib/settings";

import "./globals.css";

/**
 * Two families, both self-hosted by Next's font pipeline so there is no
 * render-blocking request to a third party and no layout shift on swap:
 * Cormorant Garamond for elegant display headlines, Manrope for refined UI.
 */
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
  preload: true,
});

const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${BRAND} — Luxury Watches & Premium Accessories`,
    template: `%s | ${BRAND}`,
  },
  description:
    "A curated house of premium timepieces. Qalb Collections selects watches for proportion, legibility and finishing — with warranty, honest descriptions and nationwide delivery.",
  applicationName: BRAND,
  authors: [{ name: BRAND }],
  creator: BRAND,
  publisher: BRAND,
  formatDetection: { telephone: false, address: false, email: false },
  icons: {
    icon: [{ url: "/media/brand/icon-512.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/media/brand/icon-180.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: BRAND,
    locale: "en_PK",
    url: siteUrl,
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 1200, alt: BRAND }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#140808",
  colorScheme: "light",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  return (
    <html
      lang="en"
      dir="ltr"
      className={`${display.variable} ${sans.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased" suppressHydrationWarning>
        <a
          href="#main"
          className="sr-only-focusable fixed left-4 top-4 z-[100] bg-ink px-4 py-3 text-xs uppercase tracking-[0.2em] text-warm-white"
        >
          Skip to content
        </a>
        {children}
        <Toaster />
        <JsonLdGraph items={[organizationSchema(settings), websiteSchema(settings)]} />
      </body>
    </html>
  );
}
