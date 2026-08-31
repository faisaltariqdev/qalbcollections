"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";

import { Spinner } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { signOutCustomer } from "@/server/actions/auth-actions";

const LINKS = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/profile", label: "Profile" },
] as const;

/**
 * Account navigation. A client component only because it highlights the current
 * route; the pages themselves stay on the server.
 */
export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="lg:sticky lg:top-28 lg:self-start">
      <ul className="flex gap-6 overflow-x-auto border-b border-line pb-3 lg:block lg:gap-0 lg:space-y-1 lg:border-b-0 lg:pb-0">
        {LINKS.map((link) => {
          const active =
            link.href === "/account" ? pathname === link.href : pathname.startsWith(link.href);

          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block whitespace-nowrap py-1.5 text-sm transition-colors lg:py-2",
                  active ? "text-ink" : "text-muted hover:text-ink",
                )}
              >
                <span className={active ? "border-b border-ink pb-0.5" : undefined}>
                  {link.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <form action={signOutCustomer} className="mt-7 lg:mt-9">
        <SignOutButton />
      </form>
    </nav>
  );
}

function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="eyebrow inline-flex items-center gap-2 text-[0.5625rem] text-faint transition-colors hover:text-ink disabled:opacity-60"
    >
      {pending ? <Spinner className="size-3" /> : null}
      Sign out
    </button>
  );
}
