/**
 * Creates an admin session directly in the E2E database and prints the raw
 * token to stdout as JSON. Used by admin.spec.ts beforeAll to bypass the
 * rate-limited sign-in form when running the full test suite.
 *
 * Usage:
 *   DATABASE_URL="file:///abs/path/to/prisma/e2e.db" \
 *     ADMIN_EMAIL="e2e-admin@qalbcollections.com" \
 *     node tests/e2e/create-admin-session.mjs
 */

import { createHash, randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

// DATABASE_URL must be set by the caller so Prisma uses the right database.
// If not provided, fall back to the e2e.db next to the workspace root.
if (!process.env.DATABASE_URL) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../");
  const absPath = path.join(root, "prisma", "e2e.db");
  process.env.DATABASE_URL = `file://${absPath}`;
}

// Import AFTER setting DATABASE_URL so Prisma picks it up.
const { PrismaClient } = await import("@prisma/client");
const db = new PrismaClient();

const adminEmail = process.env.ADMIN_EMAIL ?? "e2e-admin@qalbcollections.com";
const admin = await db.adminUser.findUnique({ where: { email: adminEmail } });
if (!admin) {
  process.stderr.write(`Admin user not found: ${adminEmail}\n`);
  process.exit(1);
}

const token = randomBytes(32).toString("base64url");
const tokenHash = createHash("sha256").update(token).digest("hex");
const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

await db.session.create({
  data: { tokenHash, adminUserId: admin.id, expiresAt, userAgent: "playwright-e2e-setup" },
});

// Print only JSON so the caller can parse stdout cleanly.
process.stdout.write(JSON.stringify({ token, expiresAt: expiresAt.toISOString() }) + "\n");

await db.$disconnect();
