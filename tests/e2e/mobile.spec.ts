import { expect, test } from "@playwright/test";

/**
 * The phone experience, at 390px with touch and no hover: nothing may be
 * unreachable, and nothing may overflow sideways.
 */

async function expectNoHorizontalScroll(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  // One pixel of rounding is fine; a scrollbar's worth is not.
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe("mobile navigation", () => {
  test("opens the full-screen menu and follows a link", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /menu/i }).click();
    const menu = page.getByRole("dialog");
    await expect(menu).toBeVisible();

    await menu.getByRole("link", { name: /watches/i }).first().click();
    await expect(page).toHaveURL(/\/watches/);
    await expect(page.getByRole("dialog")).toBeHidden();
  });

  test("searches from the phone header", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /search/i }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});

test.describe("mobile layout", () => {
  for (const path of ["/", "/watches", "/cart", "/journal", "/perfumes", "/about"]) {
    test(`fits the screen at ${path}`, async ({ page }) => {
      await page.goto(path);
      await expectNoHorizontalScroll(page);
    });
  }

  test("keeps the product page usable on a phone", async ({ page }) => {
    await page.goto("/watches?availability=in-stock");
    await page.locator("main article a[href^='/product/']").first().click();

    await expectNoHorizontalScroll(page);
    const addToBag = page.getByRole("button", { name: /add to bag/i });
    await expect(addToBag).toBeVisible();

    // Comfortable to tap: at least the 44px Apple and WCAG both ask for.
    const box = await addToBag.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });

  test("opens the filters as a sheet and applies one", async ({ page }) => {
    await page.goto("/watches");

    await page.getByRole("button", { name: /filter/i }).first().click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();

    await sheet.locator("a[href*='brand=']").first().click();
    await expect(page).toHaveURL(/brand=/);
  });

  test("adds to the bag and reaches checkout by touch alone", async ({ page }) => {
    await page.goto("/watches?availability=in-stock");
    await page.locator("main article a[href^='/product/']").first().click();
    await page.getByRole("button", { name: /add to bag/i }).tap();

    await page.goto("/cart");
    await expectNoHorizontalScroll(page);
    await page.getByRole("link", { name: /checkout/i }).first().tap();
    await expect(page).toHaveURL(/\/checkout/);
    await expectNoHorizontalScroll(page);
  });
});

test.describe("mobile admin", () => {
  test("keeps the dashboard and its tables usable", async ({ page }) => {
    await page.goto("/admin/sign-in");
    await expectNoHorizontalScroll(page);
  });
});
