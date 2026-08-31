import { expect, test } from "@playwright/test";

/**
 * The first visit: does the homepage arrive whole, can a shopper reach the
 * catalogue, and does the perfume category behave like a promise rather than a
 * product?
 */

test.describe("homepage", () => {
  test("opens on the hero and leads into the catalogue", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: /explore watches/i }).first()).toBeVisible();

    await page.getByRole("link", { name: /explore watches/i }).first().click();
    await expect(page).toHaveURL(/\/watches/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("shows one h1 and a sensible heading order", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("h1")).toHaveCount(1);
    expect(await page.locator("h2").count()).toBeGreaterThan(2);
  });

  test("carries the brand's own metadata and structured data", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Qalb Collections/i);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /.+/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /.+/);

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = blocks.flatMap((block) => {
      const parsed = JSON.parse(block);
      return (Array.isArray(parsed) ? parsed : [parsed]).map((entry) => entry["@type"]);
    });
    expect(types).toContain("Organization");
    expect(types).toContain("WebSite");
  });

  test("gives every image a description", async ({ page }) => {
    await page.goto("/");
    const missing = await page.locator("img:not([alt])").count();
    expect(missing).toBe(0);
  });

  test("reaches the footer's customer care and legal links", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("link", { name: /shipping/i }).first()).toBeVisible();
    await expect(footer.getByRole("link", { name: /privacy/i }).first()).toBeVisible();
  });
});

test.describe("navigation", () => {
  test("opens the shop menu and follows it to new arrivals", async ({ page }) => {
    await page.goto("/");

    const shop = page.getByRole("banner").getByRole("link", { name: /^shop$/i });
    await shop.hover();
    await expect(shop).toHaveAttribute("aria-expanded", "true");

    await page.getByRole("banner").getByRole("link", { name: /new arrivals/i }).first().click();
    await expect(page).toHaveURL(/\/new-arrivals/);
  });

  test("keeps the header reachable by keyboard", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
  });
});

test.describe("perfumes", () => {
  test("presents the category as coming soon, with no way to buy", async ({ page }) => {
    await page.goto("/perfumes");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/coming soon/i).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /add to bag/i })).toHaveCount(0);
  });

  test("collects an email for the launch", async ({ page }) => {
    await page.goto("/perfumes");

    const email = page.getByLabel(/email/i).first();
    await email.fill(`e2e-notify-${Date.now()}@example.com`);
    await page.getByRole("button", { name: /notify me/i }).first().click();

    await expect(page.getByText(/list|first|thank/i).first()).toBeVisible();
  });
});

test.describe("content", () => {
  test("reads a journal article", async ({ page }) => {
    await page.goto("/journal");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.locator("main a[href^='/journal/']").first().click();
    await expect(page).toHaveURL(/\/journal\/.+/);

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.join(" ")).toContain("Article");
  });

  test("serves the legal pages", async ({ page }) => {
    for (const path of ["/privacy-policy", "/terms", "/shipping-policy", "/returns-policy"]) {
      const response = await page.goto(path);
      expect(response?.status(), path).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });

  test("answers a missing page with a 404 and a way onward", async ({ page }) => {
    const response = await page.goto("/product/no-such-piece");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("link", { name: /home|watches/i }).first()).toBeVisible();
  });

  // A loading boundary above these routes would commit a 200 before the page
  // could answer, turning every unknown slug into a soft 404.
  test("answers unknown slugs with a real 404 status", async ({ request }) => {
    for (const path of [
      "/product/no-such-piece",
      "/category/no-such-category",
      "/collection/no-such-collection",
      "/journal/no-such-article",
    ]) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(404);
    }
  });

  test("publishes a sitemap, robots and llms.txt", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain("<urlset");

    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain("Sitemap:");

    const llms = await request.get("/llms.txt");
    expect(llms.status()).toBe(200);
    expect(await llms.text()).toContain("Qalb Collections");
  });
});
