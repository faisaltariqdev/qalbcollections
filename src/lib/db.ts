import { PrismaClient } from "@prisma/client";

import { serverEnv } from "./env";

/**
 * A single Prisma client per process. Next.js hot-reloads modules in
 * development, so the instance is cached on `globalThis` to avoid exhausting
 * database connections.
 */

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const env = serverEnv();
  return new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? createClient();

if (serverEnv().NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
