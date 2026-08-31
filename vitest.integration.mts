import path from "node:path";

import { defineConfig } from "vitest/config";

/**
 * Integration tests.
 *
 * These run the real Server Actions and Prisma queries against a throwaway
 * SQLite database. Three framework modules are replaced with local stand-ins so
 * server code can run outside a Next.js request; nothing about the application's
 * own logic is mocked.
 */

const stub = (file: string) => path.resolve(import.meta.dirname, "tests/integration/stubs", file);

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "next/headers": stub("next-headers.ts"),
      "next/cache": stub("next-cache.ts"),
      "server-only": stub("empty.ts"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/integration/**/*.test.ts"],
    globalSetup: ["./tests/integration/global-setup.ts"],
    setupFiles: ["./tests/integration/setup.ts"],
    // One database, one connection: these tests write, so they run in sequence.
    fileParallelism: false,
    maxWorkers: 1,
    env: {
      DATABASE_URL: `file:${path.resolve(import.meta.dirname, "prisma/test.db")}`,
      AUTH_SECRET: "integration-suite-secret-long-enough-for-validation",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      PAYMENT_PROVIDERS: "cod,bank-transfer",
    },
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
