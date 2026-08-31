import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Unit and component tests.
 *
 * The suite covers the pure logic that decides what a customer pays, sees and
 * is allowed to do: money, filters, validation and permissions. Anything that
 * needs a database or a browser belongs in the Playwright suite instead.
 */
export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    css: false,
  },
});
