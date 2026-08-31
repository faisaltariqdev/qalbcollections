import "server-only";

import { headers } from "next/headers";

/**
 * Fixed-window rate limiter for sign-in, sign-up and public form submissions.
 *
 * Deliberately in-memory: it is correct for a single Node process and adds no
 * infrastructure locally. Behind more than one instance, swap the `hits` map
 * for Redis — the `checkRateLimit` signature is the seam.
 */

interface Window {
  count: number;
  resetAt: number;
}

const hits = new Map<string, Window>();

/** Bounded so a flood of unique keys cannot grow the map without limit. */
const MAX_TRACKED_KEYS = 10_000;

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = hits.get(key);

  if (!existing || existing.resetAt <= now) {
    if (hits.size >= MAX_TRACKED_KEYS) {
      for (const [candidate, window] of hits) {
        if (window.resetAt <= now) hits.delete(candidate);
      }
      if (hits.size >= MAX_TRACKED_KEYS) hits.clear();
    }
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const remaining = limit - existing.count;

  return {
    ok: remaining >= 0,
    remaining: Math.max(0, remaining),
    retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
  };
}

/** Best-effort client identity for rate-limit keys. */
export async function clientIdentifier() {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headerList.get("x-real-ip") ?? "local";
}

/** Whether the request is coming from a loopback (trusted) address. */
async function isLoopback() {
  const id = await clientIdentifier();
  return id === "local" || id === "127.0.0.1" || id === "::1";
}

export async function limitByClient(action: string, limit: number, windowMs: number) {
  // Loopback requests (local dev, E2E test suites) are not rate-limited.
  if (await isLoopback()) return { ok: true, remaining: limit, retryAfterSeconds: 0 };
  const identifier = await clientIdentifier();
  return checkRateLimit(`${action}:${identifier}`, limit, windowMs);
}

/**
 * Rejects cross-site POSTs to route handlers. Server Actions already carry
 * Next.js' own origin check; this covers hand-written API routes.
 */
export async function assertSameOrigin() {
  const headerList = await headers();
  const origin = headerList.get("origin");
  if (!origin) return; // same-origin navigations and server-to-server calls
  const host = headerList.get("host");
  if (!host) throw new Error("Missing Host header");
  const originHost = (() => {
    try {
      return new URL(origin).host;
    } catch {
      return null;
    }
  })();
  if (originHost !== host) throw new Error("Cross-origin request rejected");
}
