import { expect, test } from "@playwright/test";

/**
 * Finding a piece: the listing filters, the search, and the two guided tools.
 */

test.describe("listing", () => {
  test("shows a count and narrows it with a brand filter", async ({ page }) => {
    await page.goto("/watches");

    const grid = page.locator("main article");
    const before = await grid.count();
    expect(before).toBeGreaterThan(1);

    const firstBrandFilter = page.locator("main a[href*='brand=']").first();
    const label = (await firstBrandFilter.textContent())?.trim() ?? "";
    await firstBrandFilter.click();

    await expect(page).toHaveURL(/brand=/);
    const after = await page.locator("main article").count();
    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThanOrEqual(before);
    expect(label.length).toBeGreaterThan(0);
  });

  test("clears a filter from its chip", async ({ page }) => {
    await page.goto("/watches");
    await page.locator("main a[href*='brand=']").first().click();
    await expect(page).toHaveURL(/brand=/);

    await page.getByRole("link", { name: /clear|reset/i }).first().click();
    await expect(page).not.toHaveURL(/brand=/);
  });

  test("sorts by price, low to high", async ({ page }) => {
    await page.goto("/watches?sort=price-asc");

    // The current price only: a struck-through compare-at price is also numeric.
    const prices = await page.locator("main article span[data-numeric]").allTextContents();
    const numbers = prices
      .map((text) => Number(text.replace(/[^0-9]/g, "")))
      .filter((value) => value > 0);

    expect(numbers.length).toBeGreaterThan(1);
    expect([...numbers]).toEqual([...numbers].sort((a, b) => a - b));
  });

  test("filters on a category-declared attribute", async ({ page }) => {
    await page.goto("/watches");

    const attribute = page.locator("main a[href*='attr_']").first();
    await expect(attribute).toBeVisible();
    await attribute.click();

    await expect(page).toHaveURL(/attr_/);
    expect(await page.locator("main article").count()).toBeGreaterThan(0);
  });

  test("says so, kindly, when a filter leaves nothing", async ({ page }) => {
    await page.goto("/watches?brand=NoSuchBrand");
    await expect(page.getByText(/no pieces|nothing|no results/i).first()).toBeVisible();
  });
});

test.describe("search", () => {
  test("suggests products as the shopper types, then opens one", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Search", exact: true }).click();
    await page.getByLabel("Search products").fill("cartier");

    const suggestion = page.getByRole("dialog").locator("a[href^='/product/']").first();
    await expect(suggestion).toBeVisible();
    await suggestion.click();

    await expect(page).toHaveURL(/\/product\/.+/);
  });

  test("offers a way forward when nothing matches", async ({ page }) => {
    await page.goto("/search?q=zzzzzzzz");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/no |nothing/i).first()).toBeVisible();
  });
});

test.describe("guided discovery", () => {
  test("walks the timepiece finder to a set of recommendations", async ({ page }) => {
    await page.goto("/find-your-timepiece");

    // Every answer is a link that writes a real filter parameter, so the flow
    // works without JavaScript. Answer the first question, then decline the rest:
    // the occasion alone still has to return the pieces that match it.
    // Navigate via href to avoid client-side hydration race conditions.
    const firstOption = page.locator("main ul a[href*='/find-your-timepiece?']").first();
    await expect(firstOption).toBeVisible();
    const firstHref = await firstOption.getAttribute("href");
    await page.goto(firstHref!);

    for (let step = 0; step < 4; step += 1) {
      const decline = page.getByRole("link", { name: /no preference|no budget in mind/i }).first();
      // Wait for the question page to fully load before checking for the link.
      const visible = await expect(decline).toBeVisible({ timeout: 8000 }).then(() => true).catch(() => false);
      if (!visible) break;
      const href = await decline.getAttribute("href");
      if (!href) break;
      await page.goto(href);
    }

    await expect(page.getByText(/pieces? fits?/i).first()).toBeVisible();
    await expect(page.locator("main article").first()).toBeVisible();
  });

  test("takes the gift guide to a filtered set", async ({ page }) => {
    await page.goto("/gift-guide");
    await page.locator("main a[href*='/gift-guide']").first().click();
    await expect(page.locator("main article").first()).toBeVisible();
  });
});
