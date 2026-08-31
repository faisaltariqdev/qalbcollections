import Link from "next/link";
import { ArrowRight, Sparkles, Gift } from "lucide-react";

import {
  ChampagneLine,
  Container,
  Eyebrow,
  Section,
} from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/reveal";

/**
 * Watch Finder — editorial intent grid.
 * Each choice is a minimal tile: large serif label + hover champagne border.
 */
export function WatchFinderBlock({
  eyebrow,
  title,
  body,
  intents,
}: {
  eyebrow?: string | null;
  title: string;
  body?: string | null;
  intents: { slug: string; label: string }[];
}) {
  return (
    <Section tone="ivory">
      <Container>
        <Reveal className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:gap-28">
          <div>
            <Eyebrow className="flex items-center gap-3 text-ash">
              <Sparkles className="size-3" aria-hidden />
              {eyebrow ?? "Find your timepiece"}
            </Eyebrow>
            <h2 className="mt-6 text-display-md text-ink">{title}</h2>
            <ChampagneLine className="mt-8 w-20" />
            {body ? (
              <p className="mt-8 max-w-md text-[1rem] leading-loose text-dust">{body}</p>
            ) : null}
          </div>

          <div>
            <p className="eyebrow text-ash tracking-[0.22em]">What are you looking for?</p>
            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {intents.map((intent) => (
                <Link
                  key={intent.slug}
                  href={`/find-your-timepiece?intent=${intent.slug}`}
                  className="group card-luxury flex min-h-[5.5rem] flex-col justify-between border border-line bg-cream p-5 transition-all duration-400 hover:border-ink/30"
                >
                  <span className="font-display text-[1.25rem] font-light leading-tight text-ink">
                    {intent.label}
                  </span>
                  <ArrowRight className="size-3 self-end text-ash transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-ink" />
                </Link>
              ))}
            </div>

            <Link
              href="/find-your-timepiece"
              className="link-sweep eyebrow mt-8 inline-flex items-center gap-3 text-ink tracking-[0.2em]"
            >
              Answer four questions <ArrowRight className="size-3" />
            </Link>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}

/**
 * Gift Guide — editorial tag-style navigation.
 */
export function GiftGuideBlock({
  eyebrow,
  title,
  body,
  occasions,
  audiences,
}: {
  eyebrow?: string | null;
  title: string;
  body?: string | null;
  occasions: { slug: string; label: string }[];
  audiences: { slug: string; label: string }[];
}) {
  return (
    <Section tone="cream" spacing="tight">
      <Container>
        <Reveal>
          <div className="border border-line p-10 sm:p-16">
            <div className="grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:gap-24">
              <div>
                <Eyebrow className="flex items-center gap-3 text-ash">
                  <Gift className="size-3" aria-hidden />
                  {eyebrow ?? "Gifting"}
                </Eyebrow>
                <h2 className="mt-6 text-display-md text-ink">{title}</h2>
                {body ? (
                  <p className="mt-6 max-w-sm text-[0.9375rem] leading-relaxed text-dust">{body}</p>
                ) : null}
              </div>

              <div className="space-y-10">
                <div>
                  <p className="eyebrow text-ash tracking-[0.22em]">Who is it for</p>
                  <div className="mt-5 flex flex-wrap gap-2.5">
                    {audiences.map((a) => (
                      <Link
                        key={a.slug}
                        href={`/gift-guide?for=${a.slug}`}
                        className="border border-line px-4 py-2.5 text-[0.8125rem] text-dust transition-colors hover:border-ink/40 hover:text-ink"
                      >
                        {a.label}
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="eyebrow text-ash tracking-[0.22em]">The occasion</p>
                  <div className="mt-5 flex flex-wrap gap-2.5">
                    {occasions.map((o) => (
                      <Link
                        key={o.slug}
                        href={`/gift-guide?occasion=${o.slug}`}
                        className="border border-line px-4 py-2.5 text-[0.8125rem] text-dust transition-colors hover:border-ink/40 hover:text-ink"
                      >
                        {o.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
