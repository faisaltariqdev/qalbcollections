"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ExternalLink, Menu, X } from "lucide-react";
import { useFormStatus } from "react-dom";

import { ADMIN_NAV } from "@/components/admin/admin-nav";
import { Logo } from "@/components/layout/logo";
import { Spinner } from "@/components/ui/primitives";
import { ADMIN_ROLE_LABELS, type AdminRole } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { signOutAdmin } from "@/server/actions/admin-auth-actions";

/**
 * Admin chrome: a fixed sidebar on desktop, a slide-over on mobile.
 *
 * The navigation it renders has already been filtered on the server to what the
 * signed-in role may reach, so this component never decides authorisation.
 */
export function AdminShell({
  admin,
  allowed,
  children,
}: {
  admin: { name: string; email: string; role: AdminRole };
  allowed: string[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const sections = ADMIN_NAV.map((section) => ({
    ...section,
    items: section.items.filter((item) => allowed.includes(item.href)),
  })).filter((section) => section.items.length > 0);

  const nav = (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-4 py-6">
      {sections.map((section) => (
        <div key={section.label} className="mb-7">
          <p className="eyebrow px-3 text-[0.5rem] text-faint">{section.label}</p>
          <ul className="mt-2 space-y-0.5">
            {section.items.map((item) => {
              const active = item.prefix
                ? pathname === item.href || pathname.startsWith(`${item.href}/`)
                : pathname === item.href;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-shell font-medium text-ink"
                        : "text-muted hover:bg-shell/70 hover:text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-line px-6 py-5">
      <p className="truncate text-sm text-ink">{admin.name}</p>
      <p className="mt-0.5 truncate text-xs text-faint">{admin.email}</p>
      <p className="eyebrow mt-2 text-[0.5rem] text-qalb">{ADMIN_ROLE_LABELS[admin.role]}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <form action={signOutAdmin}>
          <SignOutButton />
        </form>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-faint transition-colors hover:text-ink"
        >
          Storefront
          <ExternalLink className="size-3" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-line lg:flex lg:h-dvh lg:flex-col lg:sticky lg:top-0">
        <div className="flex h-16 items-center border-b border-line px-6">
          <Link href="/admin" aria-label="Admin home">
            <Logo size="sm" />
          </Link>
        </div>
        {nav}
        {footer}
      </aside>

      <div className="min-w-0">
        {/* Mobile bar */}
        <div className="flex h-14 items-center justify-between border-b border-line px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex size-10 items-center justify-center text-ink"
            aria-label="Open admin menu"
          >
            <Menu className="size-5" strokeWidth={1.5} />
          </button>
          <Logo size="sm" />
          <span className="size-10" aria-hidden />
        </div>

        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close admin menu"
              onClick={() => setOpen(false)}
              className="absolute inset-0 bg-obsidian/50"
            />
            <div className="absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col bg-canvas shadow-panel">
              <div className="flex h-14 items-center justify-between border-b border-line px-5">
                <Logo size="sm" />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex size-9 items-center justify-center text-muted"
                  aria-label="Close admin menu"
                >
                  <X className="size-4" />
                </button>
              </div>
              {nav}
              {footer}
            </div>
          </div>
        ) : null}

        <main className="min-w-0 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="eyebrow inline-flex items-center gap-2 text-[0.5rem] text-muted transition-colors hover:text-ink disabled:opacity-60"
    >
      {pending ? <Spinner className="size-3" /> : null}
      Sign out
    </button>
  );
}
