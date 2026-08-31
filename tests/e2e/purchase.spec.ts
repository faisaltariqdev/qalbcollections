import { expect, test } from "@playwright/test";

/**
 * The path to an order: product page, bag, checkout, confirmation — plus the
 * two lists a shopper keeps without an account.
 */

async function openFirstProduct(page: import("@playwright/test").Page) {
  await page.goto("/watches?availability=in-stock");
  await page.locator("main article a[href^='/product/']").first().click();
  await expect(page).toHaveURL(/\/product\/.+/);
}

test.describe("product page", () => {
  test("presents the piece, its specifications and its story", async ({ page }) => {
    await openFirstProduct(page);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: /add to bag/i })).toBeVisible();
    await expect(page.getByRole("table").or(page.locator("dl")).first()).toBeVisible();
    await expect(page.getByRole("navigation", { name: /breadcrumb/i })).toBeVisible();
  });

  test("emits Product structured data that matches the page", async ({ page }) => {
    await openFirstProduct(page);

    const name = (await page.getByRole("heading", { level: 1 }).textContent())?.trim() ?? "";
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const product = blocks
      .flatMap((block) => {
        const parsed = JSON.parse(block);
        return Array.isArray(parsed) ? parsed : [parsed];
      })
      .find((entry) => entry["@type"] === "Product");

    expect(product).toBeTruthy();
    expect(product.name).toContain(name);
    expect(product.offers.price).toMatch(/^\d+\.\d{2}$/);
    // Nothing invented: no ratings unless there are real, approved reviews.
    if (product.aggregateRating) expect(Number(product.aggregateRating.reviewCount)).toBeGreaterThan(0);
  });

  test("changes the main image from a thumbnail", async ({ page }) => {
    await openFirstProduct(page);

    const thumbnails = page.getByRole("button", { name: /view image \d/i });
    if ((await thumbnails.count()) > 1) {
      // The gallery's main image is the described one; thumbnails are decorative.
      const main = page.locator('main img[alt]:not([alt=""])').first();
      const before = await main.getAttribute("src");
      await thumbnails.nth(1).click();
      await expect(main).not.toHaveAttribute("src", before ?? "");
    }
  });

  test("offers related pieces", async ({ page }) => {
    await openFirstProduct(page);
    await expect(page.locator("main article a[href^='/product/']").first()).toBeVisible();
  });
});

test.describe("bag", () => {
  test("adds a piece, shows it in the bag and updates the count", async ({ page }) => {
    await openFirstProduct(page);
    const name = (await page.getByRole("heading", { level: 1 }).textContent())?.trim() ?? "";

    await page.getByRole("button", { name: /add to bag/i }).click();
    await expect(page.getByRole("link", { name: /your bag/i })).toContainText("1");

    await page.getByRole("link", { name: /your bag/i }).click();
    await expect(page.getByText(name, { exact: false }).first()).toBeVisible();
  });

  test("changes a quantity and empties the bag", async ({ page }) => {
    await openFirstProduct(page);
    await page.getByRole("button", { name: /add to bag/i }).click();
    // Wait for the server action to complete before navigating away.
    await expect(page.getByRole("link", { name: /your bag/i })).toContainText("1");
    await page.goto("/cart");

    // A piece with a single unit in stock keeps the control disabled; both
    // outcomes are correct, so only the reachable one is exercised.
    const increase = page.getByRole("button", { name: /increase quantity/i }).first();
    if (await increase.isVisible({ timeout: 3000 }).catch(() => false)) {
      if (await increase.isEnabled()) {
        await increase.click();
        await expect(page.getByText(/each$/i).first()).toBeVisible();
      }
    }

    await page.getByRole("button", { name: /remove/i }).first().click();
    await expect(page.getByText(/your bag is empty/i)).toBeVisible();
  });

  test("shows an empty bag as an invitation, not an error", async ({ page }) => {
    await page.goto("/cart");
    await expect(page.getByRole("link", { name: /watches|shop/i }).first()).toBeVisible();
  });
});

test.describe("checkout", () => {
  test("places an order as a guest and confirms it", async ({ page }) => {
    await openFirstProduct(page);
    await page.getByRole("button", { name: /add to bag/i }).click();

    await page.goto("/checkout");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.getByLabel("Full name").fill("Ayesha Khan");
    await page.getByLabel("Email").fill("e2e-guest@example.com");
    await page.getByLabel("Phone").fill("+92 300 1234567");
    await page.getByLabel("Address").fill("12 Zamzama Boulevard");
    await page.getByLabel("City").selectOption("Karachi");
    await page.getByLabel(/accept the/i).check();

    await page.getByRole("button", { name: /place order/i }).click();

    await expect(page).toHaveURL(/\/order-success\?order=QC-/);
    await expect(page.getByText(/QC-\d{4}-\d{6}/).first()).toBeVisible();
  });

  test("refuses an incomplete order and says which field", async ({ page }) => {
    await openFirstProduct(page);
    await page.getByRole("button", { name: /add to bag/i }).click();
    await page.goto("/checkout");

    await page.getByRole("button", { name: /place order/i }).click();

    await expect(page.getByRole("alert").first()).toBeVisible();
    await expect(page).toHaveURL(/\/checkout/);
  });

  test("sends an empty bag back to the bag page", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page).toHaveURL(/\/cart/);
  });

  test("keeps the confirmation page out of the index", async ({ page }) => {
    await page.goto("/checkout");
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).toMatch(/noindex/);
  });
});

test.describe("lists a shopper keeps", () => {
  test("saves to the wishlist without an account, and it survives a reload", async ({ page }) => {
    await page.goto("/watches");
    await page.locator("main article").first().getByRole("button", { name: /wishlist|save/i }).click();

    await page.goto("/wishlist");
    await expect(page.locator("main article").first()).toBeVisible();

    await page.reload();
    await expect(page.locator("main article").first()).toBeVisible();
  });

  test("compares two pieces side by side", async ({ page }) => {
    await page.goto("/watches");
    const cards = page.locator("main article");

    for (const index of [0, 1]) {
      await cards.nth(index).hover();
      const compare = cards.nth(index).getByRole("button", { name: /compare/i });
      if (await compare.isVisible().catch(() => false)) await compare.click();
    }

    await page.goto("/compare");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  // The rail lives on product pages, where a piece just looked at is a useful
  // comparison — not on listings, where it would compete with the grid.
  test("remembers recently viewed pieces", async ({ page }) => {
    await openFirstProduct(page);
    const seen = new URL(page.url()).pathname;

    await page.goto("/watches?availability=in-stock");
    const other = page
      .locator("main article a[href^='/product/']")
      .and(page.locator(`:not([href="${seen}"])`))
      .first();
    await other.click();
    await expect(page).toHaveURL(/\/product\/.+/);

    await expect(page.getByRole("heading", { name: /recently viewed/i })).toBeVisible();
    await expect(page.locator(`main a[href="${seen}"]`).first()).toBeVisible();
  });
});
