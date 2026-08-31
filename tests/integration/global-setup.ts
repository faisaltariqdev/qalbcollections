import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import path from "node:path";

/**
 * Builds a throwaway SQLite database from the real schema before the suite
 * runs. Integration tests exercise the actual Prisma queries, so a stubbed
 * client would prove nothing.
 */

const DB_FILE = path.join(process.cwd(), "prisma", "test.db");
const DATABASE_URL = `file:${DB_FILE}`;

export default function setup() {
  for (const suffix of ["", "-journal"]) rmSync(`${DB_FILE}${suffix}`, { force: true });

  execFileSync("npx", ["prisma", "db", "push", "--skip-generate", "--force-reset"], {
    env: { ...process.env, DATABASE_URL },
    stdio: "inherit",
  });

  return () => {
    for (const suffix of ["", "-journal"]) rmSync(`${DB_FILE}${suffix}`, { force: true });
  };
}
