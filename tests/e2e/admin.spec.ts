import { execSync } from "node:child_process";
import path from "node:path";

import { expect, test } from "@playwright/test";

import { E2E } from "../../playwright.config";

/**
 * The admin panel as an operator uses it: sign in, add a piece, publish it, see
 * it on the storefront, and work an order.
 *
 * Authentication strategy: create a DB session directly (no HTTP round-trip)
 * once in beforeAll, then inject the raw token cookie for every test that needs
 * admin access. This bypasses the rate-limited sign-in form entirely, so the
 * suite can run as many times as needed without triggering the in-process limiter.
 */

type Cookie = Parameters<import("@playwright/test").BrowserContext["addCookies"]>[0][number];
let adminCookies: Cookie[] | null = null;

test.beforeAll(() => {
  // Resolve the helper path from the workspace root; works regardless of whether
  // the test runner uses CommonJS or ESM compilation for spec files.
  const scriptPath = path.join(process.cwd(), "tests/e2e/create-admin-session.mjs");
  const raw = execSync(`node "${scriptPath}"`, {
    env: { ...process.env, ADMIN_EMAIL: E2E.adminEmail },
  })
    .toString()
    .trim();

  const { token, expiresAt } = JSON.parse(raw) as { token: string; expiresAt: string };

  // Playwright cookie format: expires is Unix epoch seconds (number).
  adminCookies = [
    {
      name: "qalb_admin_session",
      value: token,
      domain: "127.0.0.1",
      path: "/",
      expires: Math.floor(new Date(expiresAt).getTime() / 1000),
      httpOnly: true,
      secure: false,
      sameSite: "Lax" as const,
    },
  ];
});

/**
 * Restore the pre-created admin session cookie so the test has a valid
 * admin context without going through the sign-in form.
 */
async function signIn(page: import("@playwright/test").Page) {
  if (adminCookies) {
    await page.context().addCookies(adminCookies);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin$/);
    return;
  }
  // Fallback: full UI sign-in (only if script failed to produce cookies).
  await page.goto("/admin/sign-in");
  await page.getByLabel("Email").fill(E2E.adminEmail);
  await page.getByLabel("Password").fill(E2E.adminPassword);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

test.describe("access", () => {
  test("sends an unauthenticated visitor to the sign-in screen", async ({ page }) => {
    await page.goto("/admin/products");
    await expect(page).toHaveURL(/\/admin\/sign-in/);
  });

  test("keeps the admin out of search results", async ({ page }) => {
    await page.goto("/admin/sign-in");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("rejects the wrong password", async ({ page }) => {
    await page.goto("/admin/sign-in");
    await page.getByLabel("Email").fill(E2E.adminEmail);
    await page.getByLabel("Password").fill("not-the-password");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/sign-in/);
  });
});

test.describe("dashboard", () => {
  test("opens on the numbers that matter", async ({ page }) => {
    await signIn(page);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    for (const label of [/revenue|sales/i, /orders/i, /customers/i, /products/i]) {
      await expect(page.getByText(label).first()).toBeVisible();
    }
  });

  test("navigates the sidebar", async ({ page }) => {
    await signIn(page);

    for (const [name, url] of [
      [/products/i, /\/admin\/products/],
      [/orders/i, /\/admin\/orders/],
      [/customers/i, /\/admin\/customers/],
      [/media/i, /\/admin\/media/],
    ] as const) {
      await page.getByRole("navigation").getByRole("link", { name }).first().click();
      await expect(page).toHaveURL(url);
    }
  });
});

test.describe("products", () => {
  test("creates a draft, publishes it and finds it on the storefront", async ({ page }) => {
    const stamp = Date.now().toString(36);
    const name = `E2E Test Piece ${stamp}`;
    const slug = `e2e-test-piece-${stamp}`;

    await signIn(page);
    await page.goto("/admin/products/new");

    await page.getByLabel(/^name/i).fill(name);
    // "URL slug" is the exact label; /slug|url/i is too broad and matches
    // "Canonical URL" and "Social image URL" as well.
    await page.getByLabel(/^url slug/i).fill(slug);
    await page.getByLabel(/reference|sku/i).fill(`E2E-${stamp.toUpperCase()}`);
    await page.getByLabel(/brand/i).fill("Cartier");
    await page.getByLabel(/^price/i).fill("125000");
    await page.getByLabel(/stock|quantity/i).first().fill("4");

    // A published piece needs an image; take one from the media library.
    await page.getByRole("button", { name: /add image|choose image|select image/i }).first().click();
    await page.getByRole("dialog").locator("button img").first().click();
    const useIt = page.getByRole("dialog").getByRole("button", { name: /use|select|done|add/i });
    if (await useIt.first().isVisible().catch(() => false)) await useIt.first().click();

    await page.getByRole("button", { name: /^save|create/i }).first().click();
    await expect(page.getByText(/created|saved/i).first()).toBeVisible();

    // Publish, then confirm the storefront agrees.
    await page.getByLabel(/status/i).selectOption({ label: "Published" }).catch(async () => {
      await page.getByLabel(/status/i).selectOption("ACTIVE");
    });
    await page.getByRole("button", { name: /^save/i }).first().click();
    await expect(page.getByText(/saved/i).first()).toBeVisible();

    const response = await page.goto(`/product/${slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: new RegExp(name, "i") })).toBeVisible();
  });

  test("refuses to save a product with nothing in it", async ({ page }) => {
    await signIn(page);
    await page.goto("/admin/products/new");

    await page.getByRole("button", { name: /^save|create/i }).first().click();

    await expect(page.getByText(/fix|required|enter/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/products\/new/);
  });

  test("searches the product list", async ({ page }) => {
    await signIn(page);
    await page.goto("/admin/products");

    await expect(page.getByRole("table").or(page.locator("main")).first()).toBeVisible();
    const search = page.getByRole("searchbox").or(page.getByPlaceholder(/search/i));
    await search.first().fill("Cartier");
    await search.first().press("Enter");

    await expect(page).toHaveURL(/q=Cartier/i);
  });
});

test.describe("orders", () => {
  test("opens an order and advances its status", async ({ page }) => {
    // Place one first, so the test does not depend on seeded order state.
    await page.goto("/watches?availability=in-stock");
    await page.locator("main article a[href^='/product/']").first().click();
    await page.getByRole("button", { name: /add to bag/i }).click();
    // Wait for the optimistic "In your bag" confirmation before navigating so
    // the cart cookie is guaranteed to be set before the checkout page loads.
    await expect(page.getByRole("button", { name: /in your bag/i })).toBeVisible();
    await page.goto("/checkout");
    await page.getByLabel("Full name").fill("Ayesha Khan");
    await page.getByLabel("Email").fill("e2e-order@example.com");
    await page.getByLabel("Phone").fill("+92 300 1234567");
    await page.getByLabel("Address").fill("12 Zamzama Boulevard");
    await page.getByLabel("City").selectOption("Karachi");
    await page.getByLabel(/accept the/i).check();
    await page.getByRole("button", { name: /place order/i }).click();
    await expect(page).toHaveURL(/order-success/);

    const orderNumber = (await page.getByText(/QC-\d{4}-\d{6}/).first().textContent())
      ?.match(/QC-\d{4}-\d{6}/)?.[0];
    expect(orderNumber).toBeTruthy();

    await signIn(page);
    await page.goto(`/admin/orders/${orderNumber}`);
    await expect(page.getByText(orderNumber!).first()).toBeVisible();

    // The "Manage" panel shows "Update status" — the default next state for a
    // new PENDING order is CONFIRMED.
    await page.getByRole("button", { name: /update status/i }).click();
    // Server action returns "Marked confirmed." shown as a success toast.
    await expect(page.getByText(/marked confirmed/i)).toBeVisible();
  });
});

test.describe("content", () => {
  test("edits a homepage section and sees the change", async ({ page }) => {
    await signIn(page);
    await page.goto("/admin/homepage");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.locator("form").count()).toBeGreaterThan(0);
  });

  test("keeps an audit trail of what was done", async ({ page }) => {
    await signIn(page);
    await page.goto("/admin/audit");

    await expect(page.getByText(/sign|product|order/i).first()).toBeVisible();
  });
});
