import type { Metadata } from "next";

import { absoluteUrl, siteUrl } from "@/lib/env";
import { truncate } from "@/lib/utils";

/**
 * One place that builds page metadata, so canonical URLs, Open Graph and
 * robots directives cannot drift between routes.
 */

export const BRAND = "Qalb Collections";
export const DEFAULT_OG_IMAGE = "/media/brand/qalb-collections-logo.png";

export interface SeoInput {
  title: string;
  description: string;
  /** Site-relative path; becomes the canonical URL. */
  path: string;
  /** Overrides the derived canonical, for paginated or filtered variants. */
  canonicalPath?: string;
  image?: string | null;
  imageAlt?: string;
  noIndex?: boolean;
  type?: "website" | "article" | "product";
  publishedTime?: string;
  modifiedTime?: string;
  /** Appends " | Qalb Collections". Off for the homepage, which uses a full title. */
  suffixBrand?: boolean;
}

export function buildMetadata({
  title,
  description,
  path,
  canonicalPath,
  image,
  imageAlt,
  noIndex = false,
  type = "website",
  publishedTime,
  modifiedTime,
  suffixBrand = true,
}: SeoInput): Metadata {
  const canonical = absoluteUrl(canonicalPath ?? path);
  const fullTitle = suffixBrand ? `${title} | ${BRAND}` : title;
  const metaDescription = truncate(description, 158);
  const ogImage = absoluteUrl(image || DEFAULT_OG_IMAGE);

  return {
    title: fullTitle,
    description: metaDescription,
    alternates: { canonical },
    // Explicit rather than inherited, so a noindex can never leak across routes.
    robots: noIndex
      ? { index: false, follow: true, googleBot: { index: false, follow: true } }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, "max-image-preview": "large" },
        },
    openGraph: {
      type: type === "product" ? "website" : type,
      url: canonical,
      siteName: BRAND,
      title: fullTitle,
      description: metaDescription,
      locale: "en_PK",
      images: [{ url: ogImage, alt: imageAlt ?? title, width: 1200, height: 1200 }],
      ...(type === "article" ? { publishedTime, modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: metaDescription,
      images: [ogImage],
    },
  };
}

/**
 * Canonical strategy for paginated listings: page 1 is canonical to the clean
 * URL, later pages are self-canonical so deep inventory stays discoverable
 * without creating duplicate entry points.
 */
export function paginationCanonical(basePath: string, page: number) {
  return page > 1 ? `${basePath}?page=${page}` : basePath;
}

/**
 * Filtered listing views are indexable only in their unfiltered form; facet
 * combinations are near-duplicates and would dilute the category page.
 */
export function shouldNoIndexListing(searchParams: Record<string, string | string[] | undefined>) {
  const meaningfulKeys = Object.keys(searchParams).filter(
    (key) => !["page", "sort"].includes(key) && searchParams[key] !== undefined,
  );
  return meaningfulKeys.length > 0;
}

export function sitemapEntry(path: string, lastModified?: Date, priority = 0.5) {
  return {
    url: absoluteUrl(path),
    lastModified: lastModified ?? new Date(),
    priority,
  };
}

export { siteUrl };
