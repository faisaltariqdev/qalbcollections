/**
 * Canonical storefront paths.
 *
 * A few categories earn a route of their own — `/watches` reads better than
 * `/category/watches`, and perfumes need a launch page rather than a listing.
 * `/category/<slug>` permanently redirects to those, so every internal link,
 * breadcrumb and sitemap entry goes through this helper: one indexable URL per
 * category, and no link that costs the visitor a redirect.
 */

export const DEDICATED_CATEGORY_ROUTES: Record<string, string> = {
  watches: "/watches",
  perfumes: "/perfumes",
};

export function categoryPath(slug: string): string {
  return DEDICATED_CATEGORY_ROUTES[slug] ?? `/category/${slug}`;
}
