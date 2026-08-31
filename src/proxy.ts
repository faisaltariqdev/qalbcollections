import { NextResponse, type NextRequest } from "next/server";

import { COOKIES } from "@/lib/constants";

/**
 * Cheap gate for the private areas.
 *
 * It only checks that a session cookie is *present*, which is enough to send an
 * anonymous visitor to the sign-in page with a real 307 instead of streaming a
 * page shell and redirecting from inside it. The cookie is still validated
 * against the database in the layouts — this is a redirect, not authorisation.
 */
const GUEST_ONLY = ["/sign-in", "/create-account"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // The two sign-in screens are the way back in; never gate them.
  if (pathname === "/admin/sign-in") return NextResponse.next();

  // Nobody who is already signed in needs the storefront sign-in page.
  if (GUEST_ONLY.includes(pathname)) {
    if (!request.cookies.has(COOKIES.customerSession)) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = "/account";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const isAdmin = pathname.startsWith("/admin");
  const cookie = isAdmin ? COOKIES.adminSession : COOKIES.customerSession;
  if (request.cookies.has(cookie)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = isAdmin ? "/admin/sign-in" : "/sign-in";
  url.search = "";
  url.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/sign-in", "/create-account"],
};
