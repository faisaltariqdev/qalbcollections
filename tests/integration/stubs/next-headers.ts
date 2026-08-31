/**
 * `next/headers` outside a request.
 *
 * Server Actions read the session from a cookie. The integration suite calls
 * those actions directly, so it supplies the same interface backed by a jar the
 * tests control — which means the real session code (hashing, expiry, admin
 * deactivation) runs, rather than being mocked away.
 */

interface StoredCookie {
  name: string;
  value: string;
}

const jar = new Map<string, string>();
const headerBag = new Map<string, string>([["user-agent", "vitest"]]);

export function __setCookie(name: string, value: string) {
  jar.set(name, value);
}

export function __clearCookies() {
  jar.clear();
}

export function __getCookie(name: string) {
  return jar.get(name) ?? null;
}

export function __setHeader(name: string, value: string) {
  headerBag.set(name.toLowerCase(), value);
}

export async function cookies() {
  return {
    get(name: string): StoredCookie | undefined {
      const value = jar.get(name);
      return value === undefined ? undefined : { name, value };
    },
    set(name: string, value: string) {
      jar.set(name, value);
    },
    delete(name: string) {
      jar.delete(name);
    },
    has(name: string) {
      return jar.has(name);
    },
  };
}

export async function headers() {
  return {
    get(name: string) {
      return headerBag.get(name.toLowerCase()) ?? null;
    },
  };
}
