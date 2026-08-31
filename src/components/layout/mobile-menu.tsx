"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Watches", href: "/watches" },
  { label: "Collections", href: "/collections" },
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Journal", href: "/journal" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/**
 * Full-screen luxury mobile menu.
 *
 * Dark void background, large display serif links, staggered slide-in.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="-ml-2 flex size-11 items-center justify-center text-ink/85 transition-opacity hover:opacity-65 lg:hidden"
        aria-label="Open menu"
        aria-expanded={open}
      >
        <span className="flex flex-col gap-[5px]">
          <span className="block h-px w-5 bg-current" />
          <span className="block h-px w-4 bg-current" />
        </span>
      </button>

      <div
        className={cn(
          "fixed inset-0 z-50 flex flex-col bg-void transition-all duration-500 ease-[var(--ease-luxe)]",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="flex h-16 items-center justify-between px-6">
          <span className="eyebrow text-warm-white/60 tracking-[0.28em]">Qalb Collections</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex size-10 items-center justify-center text-warm-white/70 transition-colors hover:text-warm-white"
            aria-label="Close menu"
          >
            <X className="size-5" strokeWidth={1} />
          </button>
        </div>

        <div aria-hidden className="mx-6 h-px bg-champ/15" />

        <nav className="flex flex-1 flex-col justify-center px-6 py-10" aria-label="Main">
          <ul className="space-y-1">
            {LINKS.map((link, i) => (
              <li
                key={link.href}
                className={cn(
                  "transition-all duration-500 ease-[var(--ease-luxe)]",
                  open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
                )}
                style={{ transitionDelay: open ? `${80 + i * 60}ms` : "0ms" }}
              >
                <Link
                  href={link.href}
                  className="block py-3 font-display text-[clamp(2.25rem,9vw,3.75rem)] font-light leading-none text-warm-white/85 transition-colors hover:text-warm-white"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
