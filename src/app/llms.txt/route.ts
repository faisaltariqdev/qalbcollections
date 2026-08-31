import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/env";
import { formatMoney } from "@/lib/money";
import { categoryPath } from "@/lib/routes";
import { getSiteSettings } from "@/lib/settings";

/**
 * /llms.txt — a plain-text index of what this site actually contains.
 *
 * This is offered as a convenience for text-based crawlers, not as a ranking
 * device: Google has been explicit that it is not one, and every fact here is
 * generated from the same database the pages render from, so it can never claim
 * something the site does not. The canonical, structured version of all of this
 * remains the HTML and its JSON-LD.
 */

export const revalidate = 3600;

export async function GET() {
  const [settings, categories, collections, products, posts] = await Promise.all([
    getSiteSettings(),
    db.category.findMany({
      where: { status: { in: ["ACTIVE", "COMING_SOON"] } },
      orderBy: { sortOrder: "asc" },
      select: { name: true, slug: true, description: true, status: true },
    }),
    db.collection.findMany({
      where: { status: "ACTIVE" },
      orderBy: { sortOrder: "asc" },
      select: { name: true, slug: true, description: true },
    }),
    db.product.findMany({
      where: { status: "ACTIVE", noIndex: false, comingSoon: false },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      select: {
        name: true,
        slug: true,
        brand: true,
        sku: true,
        price: true,
        currency: true,
        stock: true,
        allowBackorder: true,
        shortDescription: true,
        category: { select: { name: true } },
      },
    }),
    db.blogPost.findMany({
      where: { status: "ACTIVE" },
      orderBy: { publishedAt: "desc" },
      select: { title: true, slug: true, excerpt: true },
    }),
  ]);

  const lines: string[] = [
    `# ${settings.brandName}`,
    "",
    `> ${settings.tagline}`,
    "",
    `${settings.brandName} is a Pakistan-based retailer of premium watches, with perfumes in development.`,
    "Every product listed below is a real item held for sale; prices are current and stock is live.",
    "",
    "## Contact",
    "",
    `- Website: ${absoluteUrl("/")}`,
    `- Support email: ${settings.supportEmail}`,
    ...(settings.phoneDisplay ? [`- Phone: ${settings.phoneDisplay}`] : []),
    ...(settings.addressLine ? [`- Based in: ${settings.addressLine}`] : []),
    `- Delivery: ${settings.shippingLeadTime}`,
    `- Returns: within ${settings.returnsWindowDays} days of delivery`,
    "",
    "## Key pages",
    "",
    `- [Home](${absoluteUrl("/")}): the current edit.`,
    `- [Shop](${absoluteUrl("/shop")}): every available product, filterable.`,
    `- [About](${absoluteUrl("/about")}): who ${settings.brandName} is and how pieces are chosen.`,
    `- [Find Your Timepiece](${absoluteUrl("/find-your-timepiece")}): guided selection by intent, budget and style.`,
    `- [Gift Guide](${absoluteUrl("/gift-guide")}): selections by occasion and recipient.`,
    `- [Journal](${absoluteUrl("/journal")}): buying and care guides.`,
    `- [Contact](${absoluteUrl("/contact")}).`,
    "",
    "## Categories",
    "",
  ];

  for (const category of categories) {
    const note = category.status === "COMING_SOON" ? " (announced, not yet on sale)" : "";
    lines.push(
      `- [${category.name}](${absoluteUrl(categoryPath(category.slug))})${note}: ${
        category.description ?? "—"
      }`,
    );
  }

  if (collections.length > 0) {
    lines.push("", "## Collections", "");
    for (const collection of collections) {
      lines.push(
        `- [${collection.name}](${absoluteUrl(`/collection/${collection.slug}`)}): ${
          collection.description ?? "—"
        }`,
      );
    }
  }

  lines.push("", "## Products available now", "");
  for (const product of products) {
    const availability =
      product.stock > 0 ? "in stock" : product.allowBackorder ? "on backorder" : "out of stock";
    lines.push(
      `- [${product.brand} ${product.name}](${absoluteUrl(`/product/${product.slug}`)}): ` +
        `${formatMoney(product.price, product.currency)}, ${availability}. ` +
        `SKU ${product.sku}. ${product.category.name}. ${product.shortDescription ?? ""}`.trim(),
    );
  }

  if (posts.length > 0) {
    lines.push("", "## Journal", "");
    for (const post of posts) {
      lines.push(`- [${post.title}](${absoluteUrl(`/journal/${post.slug}`)}): ${post.excerpt}`);
    }
  }

  lines.push(
    "",
    "## Notes",
    "",
    "- Prices are in the currency shown and include no hidden charges; delivery is calculated at checkout.",
    "- Product photography shows the actual item supplied.",
    `- This file is generated from the live catalogue and regenerated hourly. Last generated ${new Date().toISOString()}.`,
    "",
  );

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
