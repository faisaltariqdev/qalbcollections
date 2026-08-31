import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests.
 *
 * They run against a real Next.js server backed by its own seeded SQLite
 * database, so a test can place an order or publish a product without touching
 * the database a developer is working in.
 */

const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DATABASE_URL = `file:${path.resolve(process.cwd(), "prisma/e2e.db")}`;

export const E2E = {
  baseUrl: BASE_URL,
  adminEmail: "e2e-admin@qalbcollections.com",
  adminPassword: "E2ePass!2026",
  customerEmail: "e2e-customer@qalbcollections.com",
  customerPassword: "E2ePass!2026",
};

/**
 * Which Chromium to drive. Defaults to the Chrome already on the machine, so no
 * browser download is needed; set PLAYWRIGHT_CHANNEL=chromium in CI to use
 * Playwright's own build.
 */
const channel = process.env.PLAYWRIGHT_CHANNEL ?? "chrome";

const serverEnv = {
  DATABASE_URL,
  AUTH_SECRET: "e2e-suite-secret-long-enough-to-satisfy-validation",
  NEXT_PUBLIC_SITE_URL: BASE_URL,
  PAYMENT_PROVIDERS: "cod,bank-transfer",
  NEXT_PUBLIC_ANALYTICS_PROVIDER: "none",
  SEED_ADMIN_EMAIL: E2E.adminEmail,
  SEED_ADMIN_PASSWORD: E2E.adminPassword,
  SEED_CUSTOMER_EMAIL: E2E.customerEmail,
  SEED_CUSTOMER_PASSWORD: E2E.customerPassword,
};

export default defineConfig({
  testDir: "./tests/e2e",
  // Every spec shares one server and one database, so they run one at a time.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "desktop",
      // The mobile specs describe a phone; they belong to the mobile project.
      testIgnore: /mobile\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], channel, viewport: { width: 1440, height: 900 } },
    },
    {
      // A phone the way a customer holds one: narrow, touch, no hover.
      name: "mobile",
      testMatch: /mobile\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        channel,
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    // Seed first, then serve a production build: the same output a customer
    // would get, including the prerendered pages.
    command: `node scripts/prepare-e2e-db.mjs && npx next build && npx next start --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 420_000,
    stdout: "pipe",
    env: serverEnv,
  },
});
