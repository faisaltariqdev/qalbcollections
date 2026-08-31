import { cache } from "react";

import { db } from "@/lib/db";
import { DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/money";

/**
 * Site settings. Contact details, shipping copy, socials and feature flags live
 * in the database behind typed accessors, so no component hard-codes a phone
 * number and an editor can change them without a deploy.
 */

export interface SiteSettings {
  brandName: string;
  tagline: string;
  supportEmail: string;
  whatsappNumber: string;
  phoneDisplay: string;
  addressLine: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  currency: CurrencyCode;
  /** Minor units. */
  shippingFlatRate: number;
  /** Minor units; null disables the free-shipping threshold. */
  freeShippingThreshold: number | null;
  taxRateBps: number;
  shippingLeadTime: string;
  returnsWindowDays: number;
  perfumesLaunchNote: string;
  enableReviews: boolean;
  enableGuestCheckout: boolean;
}

export const SETTINGS_DEFAULTS: SiteSettings = {
  brandName: "Qalb Collections",
  tagline: "Timeless precision, chosen with intent.",
  supportEmail: "care@qalbcollections.com",
  whatsappNumber: "",
  phoneDisplay: "",
  addressLine: "Lahore, Pakistan",
  instagramUrl: "",
  facebookUrl: "",
  tiktokUrl: "",
  currency: DEFAULT_CURRENCY,
  shippingFlatRate: 0,
  freeShippingThreshold: null,
  taxRateBps: 0,
  shippingLeadTime: "3–5 working days",
  returnsWindowDays: 7,
  perfumesLaunchNote: "Qalb Perfumes is in development. Join the list to be told first.",
  enableReviews: true,
  enableGuestCheckout: true,
};

/** Describes how each setting is stored and edited in the admin. */
export const SETTINGS_FIELDS: {
  key: keyof SiteSettings;
  label: string;
  group: "brand" | "contact" | "social" | "commerce" | "content";
  type: "text" | "textarea" | "number" | "money" | "boolean";
  help?: string;
}[] = [
  { key: "brandName", label: "Brand name", group: "brand", type: "text" },
  { key: "tagline", label: "Tagline", group: "brand", type: "text" },
  { key: "supportEmail", label: "Support email", group: "contact", type: "text" },
  {
    key: "whatsappNumber",
    label: "WhatsApp number",
    group: "contact",
    type: "text",
    help: "International format without spaces, e.g. 923001234567. Leave blank to hide WhatsApp links.",
  },
  { key: "phoneDisplay", label: "Phone (displayed)", group: "contact", type: "text" },
  { key: "addressLine", label: "Address line", group: "contact", type: "text" },
  { key: "instagramUrl", label: "Instagram URL", group: "social", type: "text" },
  { key: "facebookUrl", label: "Facebook URL", group: "social", type: "text" },
  { key: "tiktokUrl", label: "TikTok URL", group: "social", type: "text" },
  { key: "currency", label: "Currency", group: "commerce", type: "text" },
  { key: "shippingFlatRate", label: "Flat shipping rate", group: "commerce", type: "money" },
  {
    key: "freeShippingThreshold",
    label: "Free shipping above",
    group: "commerce",
    type: "money",
    help: "Leave empty to charge shipping on every order.",
  },
  {
    key: "taxRateBps",
    label: "Tax rate (basis points)",
    group: "commerce",
    type: "number",
    help: "1700 = 17%. Set 0 for tax-inclusive pricing.",
  },
  { key: "shippingLeadTime", label: "Delivery lead time", group: "content", type: "text" },
  { key: "returnsWindowDays", label: "Returns window (days)", group: "content", type: "number" },
  { key: "perfumesLaunchNote", label: "Perfumes launch note", group: "content", type: "textarea" },
  { key: "enableReviews", label: "Enable customer reviews", group: "commerce", type: "boolean" },
  { key: "enableGuestCheckout", label: "Allow guest checkout", group: "commerce", type: "boolean" },
];

function coerce<K extends keyof SiteSettings>(key: K, raw: string): SiteSettings[K] {
  const fallback = SETTINGS_DEFAULTS[key];

  if (typeof fallback === "boolean") {
    return (raw === "true" || raw === "1") as SiteSettings[K];
  }
  if (typeof fallback === "number") {
    const parsed = Number.parseInt(raw, 10);
    return (Number.isFinite(parsed) ? parsed : fallback) as SiteSettings[K];
  }
  if (fallback === null || key === "freeShippingThreshold") {
    if (raw.trim() === "") return null as SiteSettings[K];
    const parsed = Number.parseInt(raw, 10);
    return (Number.isFinite(parsed) ? parsed : null) as SiteSettings[K];
  }
  return raw as SiteSettings[K];
}

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const rows = await db.siteSetting.findMany();
  const settings: SiteSettings = { ...SETTINGS_DEFAULTS };

  // `coerce` narrows per key; the dynamic write needs an index-signature view.
  const writable = settings as unknown as Record<string, unknown>;
  for (const row of rows) {
    if (!(row.key in SETTINGS_DEFAULTS)) continue;
    const key = row.key as keyof SiteSettings;
    writable[key] = coerce(key, row.value);
  }

  return settings;
});

/** Serialises a settings value back to its string column representation. */
export function serialiseSetting(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

export function whatsappLink(number: string, message: string) {
  if (!number) return null;
  const digits = number.replace(/[^0-9]/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
