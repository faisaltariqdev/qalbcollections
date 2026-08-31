"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const LINKS = [
  { label: "WATCHES", href: "/watches" },
  { label: "COLLECTIONS", href: "/collections" },
  { label: "NEW ARRIVALS", href: "/new-arrivals" },
  { label: "JOURNAL", href: "/journal" },
  { label: "ABOUT", href: "/about" },
];

/**
 * Centered desktop navigation from the reference.
 *
 * Small uppercase sans-serif links, white text, subtle hover underline.
 */
export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
      {LINKS.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "relative px-3.5 py-2 text-[0.8125rem] font-semibold uppercase tracking-[0.12em] transition-colors duration-300",
              isActive
                ? "text-ink"
                : "text-ink/80 hover:text-ink",
            )}
          >
            {link.label}
            <span
              aria-hidden
              className={cn(
                "absolute inset-x-4 -bottom-px h-px origin-left bg-champ transition-transform duration-500 ease-[var(--ease-luxe)]",
                isActive ? "scale-x-100" : "scale-x-0",
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}
