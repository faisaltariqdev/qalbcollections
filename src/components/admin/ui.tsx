import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Admin building blocks.
 *
 * Deliberately plainer than the storefront: dense, legible, and consistent
 * across every screen, so the dashboard reads like a tool rather than a shop.
 */

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumb?: { href: string; label: string };
}) {
  return (
    <header className="mb-8">
      {breadcrumb ? (
        <Link
          href={breadcrumb.href}
          className="eyebrow inline-flex items-center gap-1.5 text-[0.5rem] text-muted transition-colors hover:text-ink"
        >
          <ChevronLeft className="size-3" />
          {breadcrumb.label}
        </Link>
      ) : null}
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-light leading-tight text-ink">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border border-line bg-canvas", className)}>
      {title ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-sm font-medium text-ink">{title}</h2>
            {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Horizontally scrollable on small screens so no table ever breaks the layout. */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[44rem] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-line px-3 py-2.5 text-left text-[0.625rem] uppercase tracking-[0.12em] text-faint",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return (
    <td className={cn("border-b border-line-soft px-3 py-3 align-middle text-ink-soft", className)} {...props} />
  );
}

const TONE_CLASSES = {
  neutral: "border-line text-muted",
  positive: "border-success/40 text-success",
  warning: "border-warning/40 text-warning",
  danger: "border-danger/40 text-danger",
  accent: "border-qalb/40 text-qalb",
} as const;

export function StatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: keyof typeof TONE_CLASSES;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap border px-2 py-0.5 text-[0.625rem] uppercase tracking-[0.1em]",
        TONE_CLASSES[tone],
      )}
    >
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="eyebrow text-[0.5rem] text-faint">{label}</p>
      <p className="mt-3 font-display text-2xl font-light text-ink" data-numeric>
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block bg-canvas px-5 py-5 transition-colors hover:bg-shell">
        {body}
      </Link>
    );
  }

  return <div className="bg-canvas px-5 py-5">{body}</div>;
}

/** Query-string pagination, so a page of results is always linkable. */
export function Pagination({
  page,
  pageCount,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between gap-4">
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className="inline-flex items-center gap-1.5 border border-line px-3 py-2 text-xs text-ink transition-colors hover:border-ink"
        >
          <ChevronLeft className="size-3.5" />
          Previous
        </Link>
      ) : (
        <span />
      )}

      <p className="text-xs text-muted" data-numeric>
        Page {page} of {pageCount}
      </p>

      {page < pageCount ? (
        <Link
          href={hrefFor(page + 1)}
          className="inline-flex items-center gap-1.5 border border-line px-3 py-2 text-xs text-ink transition-colors hover:border-ink"
        >
          Next
          <ChevronRight className="size-3.5" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

export function AdminEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-line px-6 py-16 text-center">
      <p className="text-base text-ink">{title}</p>
      {description ? <p className="mt-2 max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
