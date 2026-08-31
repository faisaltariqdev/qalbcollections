import Link from "next/link";
import type { ReactNode } from "react";

/**
 * A deliberately small Markdown subset for editor-authored content (journal
 * posts, legal pages, product stories).
 *
 * It renders to React elements rather than an HTML string, so admin-supplied
 * text is never injected as markup and cannot carry script payloads.
 */

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\)|`[^`]+`)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text
    .split(INLINE)
    .filter((part) => part !== "")
    .map((part, index) => {
      const key = `${keyPrefix}-${index}`;

      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={key} className="font-medium text-ink">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={key}>{part.slice(1, -1)}</em>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={key} className="rounded bg-shell px-1.5 py-0.5 text-[0.9em]">
            {part.slice(1, -1)}
          </code>
        );
      }

      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
      if (link) {
        const [, label, href] = link as unknown as [string, string, string];
        const isInternal = href.startsWith("/");
        const className = "underline decoration-line/60 underline-offset-4 hover:decoration-ink";
        return isInternal ? (
          <Link key={key} href={href} className={className}>
            {label}
          </Link>
        ) : (
          <a
            key={key}
            href={href}
            className={className}
            rel="noopener noreferrer"
            target="_blank"
          >
            {label}
          </a>
        );
      }

      return <span key={key}>{part}</span>;
    });
}

/** Renders a Markdown-lite document. Wrap in `.prose-qalb` for typography. */
export function Markdown({ content, className }: { content: string; className?: string }) {
  const blocks = content.replace(/\r\n/g, "\n").split(/\n{2,}/);

  return (
    <div className={className}>
      {blocks.map((raw, blockIndex) => {
        const block = raw.trim();
        if (!block) return null;
        const key = `block-${blockIndex}`;
        const lines = block.split("\n");

        if (block.startsWith("### ")) {
          return (
            <h4 key={key} className="mt-8 font-sans text-sm font-medium tracking-wide text-ink">
              {renderInline(block.slice(4), key)}
            </h4>
          );
        }
        if (block.startsWith("## ")) {
          return (
            <h3 key={key} className="mt-10 font-display text-xl text-ink sm:text-2xl">
              {renderInline(block.slice(3), key)}
            </h3>
          );
        }
        if (block.startsWith("# ")) {
          return (
            <h2 key={key} className="mt-12 font-display text-2xl text-ink sm:text-3xl">
              {renderInline(block.slice(2), key)}
            </h2>
          );
        }

        if (lines.every((line) => /^[-*]\s/.test(line))) {
          return (
            <ul key={key} className="mt-5 space-y-2 pl-5">
              {lines.map((line, i) => (
                <li key={`${key}-${i}`} className="list-disc pl-1 marker:text-line">
                  {renderInline(line.replace(/^[-*]\s/, ""), `${key}-${i}`)}
                </li>
              ))}
            </ul>
          );
        }

        if (lines.every((line) => /^\d+\.\s/.test(line))) {
          return (
            <ol key={key} className="mt-5 space-y-2 pl-5">
              {lines.map((line, i) => (
                <li key={`${key}-${i}`} className="list-decimal pl-1 marker:text-muted">
                  {renderInline(line.replace(/^\d+\.\s/, ""), `${key}-${i}`)}
                </li>
              ))}
            </ol>
          );
        }

        if (block.startsWith("> ")) {
          return (
            <blockquote
              key={key}
              className="my-8 border-l border-line pl-6 font-display text-xl italic text-ink"
            >
              {renderInline(block.replace(/^>\s?/gm, ""), key)}
            </blockquote>
          );
        }

        return (
          <p key={key} className="mt-5 leading-relaxed">
            {renderInline(block.replace(/\n/g, " "), key)}
          </p>
        );
      })}
    </div>
  );
}

/** Strips Markdown syntax for meta descriptions and previews. */
export function markdownToPlainText(content: string) {
  return content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*`_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
