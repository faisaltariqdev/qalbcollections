import { cn } from "@/lib/utils";

const ALL_LINKS = [
  { id: "overview", label: "Overview" },
  { id: "how-to-buy", label: "How to buy" },
  { id: "story", label: "The story" },
  { id: "specifications", label: "Specifications" },
  { id: "faq", label: "Questions" },
] as const;

/**
 * In-page wayfinding for a long product page — one H1, then jump links so a
 * shopper (and a crawler) can reach specs, story and FAQs without scrolling blindly.
 */
export function ProductSectionNav({ available }: { available: readonly string[] }) {
  const links = ALL_LINKS.filter((link) => available.includes(link.id));
  if (links.length < 2) return null;

  return (
    <nav
      aria-label="On this page"
      className="sticky top-24 z-30 border-y border-ink/10 bg-nav/95 backdrop-blur-md sm:top-28"
    >
      <div className="scrollbar-slim shell-x mx-auto flex max-w-[88rem] gap-1 overflow-x-auto py-3">
        {links.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            className={cn(
              "shrink-0 px-3 py-1.5 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-dust transition-colors hover:text-ink",
            )}
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
