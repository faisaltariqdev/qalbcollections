import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Container({
  className,
  size = "default",
  ...props
}: ComponentProps<"div"> & { size?: "narrow" | "default" | "wide" | "full" }) {
  return (
    <div
      className={cn(
        "shell-x mx-auto w-full",
        size === "narrow"  && "max-w-3xl",
        size === "default" && "max-w-[88rem]",
        size === "wide"    && "max-w-[104rem]",
        className,
      )}
      {...props}
    />
  );
}

export function Section({
  className,
  tone = "cream",
  spacing = "default",
  ...props
}: ComponentProps<"section"> & {
  tone?: "cream" | "ivory" | "void" | "charcoal" | "none"
       | "canvas" | "shell" | "obsidian"; // legacy aliases
  spacing?: "none" | "tight" | "default" | "loose";
}) {
  return (
    <section
      className={cn(
        (tone === "cream" || tone === "canvas") && "bg-cream",
        (tone === "ivory" || tone === "shell")  && "bg-ivory",
        (tone === "void"  || tone === "obsidian") && "bg-void text-warm-white/80",
        tone === "charcoal" && "bg-wine text-warm-white/80",
        spacing === "tight"   && "py-16 sm:py-22",
        spacing === "default" && "py-[var(--spacing-section)]",
        spacing === "loose"   && "py-28 sm:py-44",
        className,
      )}
      {...props}
    />
  );
}

/** Small uppercase tracking label */
export function Eyebrow({
  className,
  as: As = "p",
  ...props
}: ComponentProps<"p"> & { as?: "p" | "span" | "div" }) {
  return <As className={cn("eyebrow text-dust", className)} {...props} />;
}

export interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  action?: ReactNode;
  level?: 2 | 3;
  tone?: "light" | "dark";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  action,
  level = 2,
  tone = "light",
  className,
}: SectionHeadingProps) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <div
      className={cn(
        "flex flex-col gap-8",
        align === "center"
          ? "items-center text-center"
          : "sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? (
          <div className="flex items-center gap-4">
            <span aria-hidden className={cn(
              "block h-px w-8 shrink-0",
              tone === "dark" ? "bg-warm-white/20" : "bg-ash/40",
            )} />
            <Eyebrow className={cn(
              tone === "dark" ? "text-warm-white/45" : "text-ash",
            )}>
              {eyebrow}
            </Eyebrow>
          </div>
        ) : null}
        <Heading className={cn(
          "mt-5 text-display-md",
          tone === "dark" ? "text-warm-white" : "text-ink",
        )}>
          {title}
        </Heading>
        {description ? (
          <p className={cn(
            "mt-5 text-[0.9375rem] leading-relaxed",
            tone === "dark" ? "text-warm-white/50" : "text-dust",
          )}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Divider({ className, ...props }: ComponentProps<"hr">) {
  return <hr className={cn("border-0 border-t border-line", className)} {...props} />;
}

/** Thin champagne accent rule */
export function ChampagneLine({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("rule-champ h-px w-20 animate-draw-line", className)}
    />
  );
}

/** @deprecated Use ChampagneLine — kept for compatibility */
export function GiltRule({ className }: { className?: string }) {
  return <ChampagneLine className={className} />;
}

const BADGE_TONES = {
  neutral: "border-line bg-cream text-dust",
  ink:     "border-ink bg-ink text-cream",
  qalb:    "border-ink bg-ink text-cream",
  gilt:    "border-champ/50 bg-champ-pale text-burgundy",
  champ:   "border-champ/50 bg-champ-pale text-burgundy",
  success: "border-success/30 bg-success/8 text-success",
  warning: "border-warning/30 bg-warning/8 text-warning",
  danger:  "border-danger/30 bg-danger/8 text-danger",
  outline: "border-ink/20 bg-cream/85 text-ink",
} as const;

export function Badge({
  className,
  tone = "neutral",
  ...props
}: ComponentProps<"span"> & { tone?: keyof typeof BADGE_TONES }) {
  return (
    <span
      className={cn(
        "eyebrow inline-flex items-center border px-2.5 py-1 text-[0.625rem] leading-none",
        BADGE_TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("animate-pulse bg-ivory-deep/60", className)} aria-hidden {...props} />
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block size-4 animate-spin rounded-full border border-current border-t-transparent",
        className,
      )}
    />
  );
}

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, actions, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center border border-line bg-cream px-6 py-24 text-center",
      className,
    )}>
      {icon ? <div className="mb-6 text-line" aria-hidden>{icon}</div> : null}
      <h3 className="text-display-sm">{title}</h3>
      {description ? (
        <p className="mt-4 max-w-md text-base leading-relaxed text-ink-soft">{description}</p>
      ) : null}
      {actions ? <div className="mt-9 flex flex-wrap justify-center gap-3">{actions}</div> : null}
    </div>
  );
}

export function TextLink({
  href,
  children,
  className,
  tone = "light",
  ...props
}: ComponentProps<typeof Link> & { tone?: "light" | "dark" }) {
  return (
    <Link
      href={href}
      className={cn(
        "link-sweep eyebrow inline-flex items-center gap-2.5",
        tone === "dark" ? "text-warm-white/70 hover:text-warm-white" : "text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
