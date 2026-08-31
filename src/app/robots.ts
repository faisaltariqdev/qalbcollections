import type { MetadataRoute } from "next";

import { absoluteUrl, siteUrl } from "@/lib/env";

/**
 * robots.txt.
 *
 * Everything that helps someone find a product is open. Closed off are the
 * private areas, the API surface and the URL shapes that produce endless
 * near-duplicates (facet combinations, search results, cart state).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/account",
          "/account/",
          "/cart",
          "/checkout",
          "/order-success",
          "/sign-in",
          "/create-account",
          "/search?",
          "/*?brand=",
          "/*?price=",
          "/*?sort=",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl,
  };
}
