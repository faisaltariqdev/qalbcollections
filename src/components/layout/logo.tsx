import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

const MARK = {
  void: {
    src: "/media/brand/qalb-mark-navbar.png",
    width: 447,
    height: 397,
  },
  cream: {
    src: "/media/brand/qalb-mark-cream.png",
    width: 447,
    height: 397,
  },
} as const;

const SIZE = {
  sm: "h-9 w-auto",
  md: "h-12 w-auto sm:h-14",
  lg: "h-16 w-auto",
} as const;

function BrandMark({
  tone = "void",
  size = "md",
  priority = false,
  className,
}: {
  tone?: keyof typeof MARK;
  size?: keyof typeof SIZE;
  priority?: boolean;
  className?: string;
}) {
  const mark = MARK[tone];

  return (
    <Image
      src={mark.src}
      alt="Qalb Collections"
      width={mark.width}
      height={mark.height}
      priority={priority}
      quality={90}
      className={cn(SIZE[size], "object-contain object-left", className)}
    />
  );
}

/**
 * Header wordmark — cropped house mark on the cream navbar.
 */
export function LogoLink({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <Link
      href="/"
      aria-label="Qalb Collections — home"
      className={cn("shrink-0 transition-opacity duration-300 hover:opacity-80", className)}
    >
      <BrandMark tone="cream" size={size} priority />
    </Link>
  );
}

/**
 * Inline logo for footer (void) and admin / checkout (cream).
 */
export function Logo({
  className,
  size = "md",
  tone = "cream",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  tone?: "void" | "cream";
}) {
  return <BrandMark tone={tone} size={size} className={className} />;
}
