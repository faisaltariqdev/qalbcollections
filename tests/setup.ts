import "@testing-library/jest-dom/vitest";

/**
 * The environment module validates configuration at import time, so the suite
 * supplies the same values a developer would have in `.env`.
 */
process.env.DATABASE_URL ??= "file:./prisma/test.db";
process.env.AUTH_SECRET ??= "test-secret-that-is-long-enough-for-the-schema-check";
process.env.NEXT_PUBLIC_SITE_URL ??= "https://qalbcollections.test";
