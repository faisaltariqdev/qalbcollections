import { NextResponse } from "next/server";

import { getAdminIdentity, getCustomerIdentity } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Minimal session shape for the header.
 *
 * Reading it from the client is what lets every storefront page render
 * statically: the page shell contains no per-visitor data, so it can be cached
 * and revalidated, while the account and admin affordances still appear.
 *
 * No names, emails or roles are returned — only what the header needs to draw.
 */
export async function GET() {
  const [customer, admin] = await Promise.all([getCustomerIdentity(), getAdminIdentity()]);

  return NextResponse.json(
    { signedIn: Boolean(customer), isAdmin: Boolean(admin) },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
