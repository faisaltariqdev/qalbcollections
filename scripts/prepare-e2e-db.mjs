import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

/**
 * Creates and seeds the end-to-end database.
 *
 * Run as the first step of the Playwright web server command so the schema and
 * the catalogue exist before Next.js prerenders anything against them. Uses its
 * own file, so an E2E run never touches a developer's data.
 */

const file = path.resolve(process.cwd(), "prisma/e2e.db");
const env = { ...process.env, DATABASE_URL: `file:${file}` };

for (const suffix of ["", "-journal"]) rmSync(`${file}${suffix}`, { force: true });

execFileSync("npx", ["prisma", "db", "push", "--skip-generate", "--force-reset"], {
  env,
  stdio: "inherit",
});
execFileSync("npx", ["tsx", "prisma/seed.ts"], { env, stdio: "inherit" });
