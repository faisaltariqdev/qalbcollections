import { z } from "zod";

/**
 * Validated environment. Importing this module from a Server Component or
 * Server Action guarantees the process is configured before any query runs.
 *
 * Only `NEXT_PUBLIC_*` values may be read from client components; everything
 * else lives in `serverEnv` and is never bundled for the browser.
 */

const serverSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters — run: openssl rand -base64 48"),
  PAYMENT_PROVIDERS: z.string().default("cod"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_ANALYTICS_PROVIDER: z
    .enum(["none", "console", "gtag", "plausible"])
    .default("none"),
  NEXT_PUBLIC_ANALYTICS_ID: z.string().default(""),
});

function readServerEnv() {
  const parsed = serverSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    PAYMENT_PROVIDERS: process.env.PAYMENT_PROVIDERS,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`);
    throw new Error(
      `Invalid server environment configuration:\n${issues.join("\n")}\n\nSee .env.example.`,
    );
  }

  return parsed.data;
}

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_ANALYTICS_PROVIDER: process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER,
  NEXT_PUBLIC_ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID,
});

let cachedServerEnv: z.infer<typeof serverSchema> | null = null;

export function serverEnv() {
  cachedServerEnv ??= readServerEnv();
  return cachedServerEnv;
}

/** Origin without a trailing slash, safe for building absolute URLs. */
export const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

export function absoluteUrl(path = "/") {
  // Admin-entered canonicals and remote image URLs arrive here already absolute.
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
