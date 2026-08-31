import { absoluteUrl, siteUrl } from "@/lib/env";
import { priceForStructuredData } from "@/lib/money";
import { markdownToPlainText } from "@/lib/markdown";
import type { SiteSettings } from "@/lib/settings";
import { truncate } from "@/lib/utils";

/**
 * JSON-LD builders.
 *
 * Everything here is derived from database rows. There are no invented ratings,
 * review counts, awards or certifications — an `aggregateRating` is only emitted
 * when approved reviews actually exist, because fabricated markup is both a
 * policy violation and a trust failure.
 */

type JsonLd = Record<string, unknown>;

export const ORGANIZATION_ID = `${siteUrl}/#organization`;
export const WEBSITE_ID = `${siteUrl}/#website`;

export function organizationSchema(settings: SiteSettings): JsonLd {
  const sameAs = [settings.instagramUrl, settings.facebookUrl, settings.tiktokUrl].filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: settings.brandName,
    url: siteUrl,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/media/brand/qalb-collections-logo.png"),
    },
    ...(settings.tagline ? { slogan: settings.tagline } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(settings.supportEmail || settings.phoneDisplay
      ? {
          contactPoint: [
            {
              "@type": "ContactPoint",
              contactType: "customer support",
              ...(settings.supportEmail ? { email: settings.supportEmail } : {}),
              ...(settings.phoneDisplay ? { telephone: settings.phoneDisplay } : {}),
              availableLanguage: ["en", "ur"],
            },
          ],
        }
      : {}),
    ...(settings.addressLine
      ? {
          address: {
            "@type": "PostalAddress",
            addressLocality: settings.addressLine,
            addressCountry: "PK",
          },
        }
      : {}),
  };
}

export function websiteSchema(settings: SiteSettings): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: settings.brandName,
    url: siteUrl,
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbSchema(crumbs: readonly Crumb[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export interface ProductSchemaInput {
  name: string;
  slug: string;
  brand: string;
  sku: string;
  description: string;
  images: readonly string[];
  price: number;
  currency: string;
  inStock: boolean;
  comingSoon: boolean;
  category: string;
  attributes?: readonly { label: string; value: string }[];
  reviews?: readonly {
    authorName: string;
    rating: number;
    title: string | null;
    body: string;
    createdAt: Date;
  }[];
  returnsWindowDays: number;
}

export function productSchema(input: ProductSchemaInput): JsonLd {
  const availability = input.comingSoon
    ? "https://schema.org/PreOrder"
    : input.inStock
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  const approvedReviews = input.reviews ?? [];
  const ratingCount = approvedReviews.length;

  const schema: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": absoluteUrl(`/product/${input.slug}#product`),
    name: input.name,
    sku: input.sku,
    mpn: input.sku,
    category: input.category,
    brand: { "@type": "Brand", name: input.brand },
    description: truncate(markdownToPlainText(input.description), 500),
    image: input.images.map((image) => absoluteUrl(image)),
    url: absoluteUrl(`/product/${input.slug}`),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/product/${input.slug}`),
      priceCurrency: input.currency,
      price: priceForStructuredData(input.price, input.currency),
      availability,
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": ORGANIZATION_ID },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "PK",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: input.returnsWindowDays,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
    },
  };

  if (input.attributes && input.attributes.length > 0) {
    schema.additionalProperty = input.attributes.map((attribute) => ({
      "@type": "PropertyValue",
      name: attribute.label,
      value: attribute.value,
    }));
  }

  // Emitted only from genuine, moderator-approved reviews.
  if (ratingCount > 0) {
    const total = approvedReviews.reduce((sum, review) => sum + review.rating, 0);
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: (total / ratingCount).toFixed(1),
      reviewCount: ratingCount,
      bestRating: 5,
      worstRating: 1,
    };
    schema.review = approvedReviews.map((review) => ({
      "@type": "Review",
      author: { "@type": "Person", name: review.authorName },
      datePublished: review.createdAt.toISOString().slice(0, 10),
      ...(review.title ? { name: review.title } : {}),
      reviewBody: review.body,
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
    }));
  }

  return schema;
}

export interface CollectionPageInput {
  name: string;
  description: string;
  path: string;
  items: readonly { name: string; slug: string; brand?: string; image?: string | null }[];
}

export function collectionPageSchema(input: CollectionPageInput): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: truncate(input.description, 300),
    url: absoluteUrl(input.path),
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: input.items.length,
      itemListElement: input.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.brand ? `${item.brand} ${item.name}` : item.name,
        url: absoluteUrl(`/product/${item.slug}`),
        ...(item.image ? { image: absoluteUrl(item.image) } : {}),
      })),
    },
  };
}

/**
 * A generic index page: a list of links to other pages on this site, rather
 * than a list of products. Used for the collections and journal indexes.
 */
export function indexPageSchema(input: {
  name: string;
  description: string;
  path: string;
  items: readonly { name: string; path: string }[];
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: truncate(input.description, 300),
    url: absoluteUrl(input.path),
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: input.items.length,
      itemListElement: input.items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: absoluteUrl(item.path),
      })),
    },
  };
}

export interface ArticleSchemaInput {
  title: string;
  slug: string;
  excerpt: string;
  authorName: string;
  image: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
}

export function articleSchema(input: ArticleSchemaInput): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: truncate(input.excerpt, 300),
    url: absoluteUrl(`/journal/${input.slug}`),
    ...(input.image ? { image: [absoluteUrl(input.image)] } : {}),
    author: { "@type": "Organization", name: input.authorName, "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
    ...(input.publishedAt ? { datePublished: input.publishedAt.toISOString() } : {}),
    dateModified: input.updatedAt.toISOString(),
    isPartOf: { "@id": WEBSITE_ID },
  };
}

export function howToBuySchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to buy a watch from Qalb Collections",
    description:
      "Study the photographs, read the specifications, add the piece to your bag or ask on WhatsApp, then receive a boxed watch delivered across Pakistan.",
    inLanguage: "en",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Study the photographs",
        text: "The images on the product page are of the watch you receive — dial, case-back, bracelet and box.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Read the specifications",
        text: "Movement, case size, water resistance and warranty are listed in plain language.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Add to bag, or ask",
        text: "Place the order on the product page, or message Qalb Collections on WhatsApp with the reference number. Cash on delivery is available.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "We pack and send",
        text: "Boxed, tracked, and delivered across Pakistan. Unworn returns are accepted within the stated window.",
      },
    ],
  };
}

export function listingHowToSchema(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to shop the Qalb Collections catalogue",
    description:
      "Browse atelier posters, hover for detail photographs, filter the edit, then open a product page to buy.",
    inLanguage: "en",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Read the poster",
        text: "Every card is the atelier photograph of the watch you receive — logo, dial and box included.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Hover for detail",
        text: "Move over a card to see the case-back, profile and packing. On a phone, open the piece.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Narrow the edit",
        text: "Filter by brand, movement, size or price. Sort newest, price or most chosen.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Open and decide",
        text: "The product page lists specifications, warranty and delivery. Add to bag, or ask on WhatsApp.",
      },
    ],
  };
}

export function faqSchema(items: readonly { question: string; answer: string }[]): JsonLd | null {
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

