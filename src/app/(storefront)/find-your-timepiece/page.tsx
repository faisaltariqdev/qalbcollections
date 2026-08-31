import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, RotateCcw, SearchX } from "lucide-react";

import { TrackEvent } from "@/components/analytics/track-event";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductGrid } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { Container, EmptyState, Eyebrow, GiltRule, Section } from "@/components/ui/primitives";
import type { RawSearchParams } from "@/lib/product-query";
import { buildMetadata } from "@/lib/seo/metadata";
import { buildFinderState, budgetToParams, type FinderStep } from "@/server/finder";

/**
 * Find your timepiece.
 *
 * One question per screen, each answer written into the URL as a real filter
 * parameter. No client state, no JavaScript required, and the final step hands
 * the shopper a normal listing URL they can keep refining.
 */

export const metadata: Metadata = buildMetadata({
  title: "Find your timepiece",
  description:
    "Answer a few questions — occasion, budget, movement, strap — and see the Qalb Collections pieces that actually fit.",
  path: "/find-your-timepiece",
});

function href(params: RawSearchParams, patch: Record<string, string | undefined>) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "results") continue;
    if (typeof value === "string" && value) next.set(key, value);
    else if (Array.isArray(value) && value[0]) next.set(key, value[0]);
  }
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) next.delete(key);
    else next.set(key, value);
  }
  const query = next.toString();
  return `/find-your-timepiece${query ? `?${query}` : ""}`;
}

export default async function FindYourTimepiecePage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const state = await buildFinderState(params);

  const answeredCount = state.steps.filter((step) =>
    step.param === "budget"
      ? params.budget !== undefined
      : params[step.param] !== undefined,
  ).length;

  return (
    <>
      <Breadcrumbs crumbs={[{ name: "Find your timepiece", path: "/find-your-timepiece" }]} />

      <header className="border-b border-line bg-shell">
        <Container className="py-14 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <Eyebrow className="text-qalb">Guided</Eyebrow>
              <h1 className="mt-5 text-display-lg text-ink">Find your timepiece</h1>
              <GiltRule className="mt-7" />
              <p className="mt-7 text-base leading-relaxed text-muted">
                Four questions, honestly answered, will narrow a catalogue faster than an hour of
                scrolling. Skip anything you have no view on.
              </p>
            </div>

            {answeredCount > 0 ? (
              <Link
                href="/find-your-timepiece"
                className="eyebrow inline-flex items-center gap-2 text-[0.5625rem] text-muted transition-colors hover:text-ink"
              >
                <RotateCcw className="size-3.5" />
                Start again
              </Link>
            ) : null}
          </div>
        </Container>
      </header>

      <Section spacing="default">
        <Container size={state.complete ? "default" : "narrow"}>
          {/* Progress: quiet, numeric, no bar animation. */}
          <p className="eyebrow text-faint" data-numeric>
            {state.complete
              ? "Your matches"
              : `Question ${Math.min(state.position + 1, state.steps.length)} of ${state.steps.length}`}
          </p>

          {state.complete ? (
            <>
              <h2 className="mt-5 text-display-md text-ink">
                {state.total === 0
                  ? "Nothing fits all of that"
                  : `${state.total} ${state.total === 1 ? "piece fits" : "pieces fit"}`}
              </h2>
              <GiltRule className="mt-7" />

              {state.total === 0 ? (
                <EmptyState
                  className="mt-10"
                  icon={<SearchX className="size-10" strokeWidth={1} />}
                  title="No exact match in the catalogue"
                  description="The catalogue is deliberately small, so a very specific brief can come back empty. Loosen one answer, or let us look for you."
                  actions={
                    <>
                      <Button asChild variant="primary">
                        <Link href="/find-your-timepiece">Start again</Link>
                      </Button>
                      <Button asChild variant="outline">
                        <Link href="/watches">Browse all watches</Link>
                      </Button>
                      <Button asChild variant="ghost">
                        <Link href="/contact">Ask us directly</Link>
                      </Button>
                    </>
                  }
                />
              ) : (
                <>
                  <div className="mt-12">
                    <ProductGrid products={state.matches} columns={3} priorityCount={3} />
                  </div>

                  <div className="mt-14 flex flex-wrap items-center gap-4 border-t border-line pt-8">
                    <Button asChild variant="secondary">
                      <Link href={state.listingHref}>
                        Refine with all filters <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                    <Link
                      href="/find-your-timepiece"
                      className="eyebrow text-[0.5625rem] text-muted transition-colors hover:text-ink"
                    >
                      Change my answers
                    </Link>
                  </div>
                </>
              )}
            </>
          ) : (
            <QuestionStep step={state.steps[state.position]!} params={params} />
          )}
        </Container>
      </Section>

      {state.complete ? (
        <TrackEvent
          name="watch_finder_completed"
          payload={{
            intent: (Array.isArray(params.tag) ? params.tag[0] : params.tag) ?? "unspecified",
            results: state.total,
          }}
        />
      ) : null}
    </>
  );
}

function QuestionStep({ step, params }: { step: FinderStep; params: RawSearchParams }) {
  return (
    <div>
      <h2 className="mt-5 text-display-md text-ink">{step.question}</h2>
      <GiltRule className="mt-7" />
      <p className="mt-6 text-sm leading-loose text-muted">{step.helper}</p>

      <ul className="mt-10 grid gap-3 sm:grid-cols-2">
        {step.options.map((option) => (
          <li key={option.value}>
            <Link
              href={href(
                params,
                step.param === "budget"
                  ? budgetToParams(option.value)
                  : { [step.param]: option.value },
              )}
              className="group flex items-center justify-between gap-4 border border-line bg-canvas px-5 py-5 transition-colors hover:border-ink"
            >
              <span>
                <span className="block text-base text-ink">{option.label}</span>
                {option.hint ? (
                  <span className="mt-1 block text-xs text-faint">{option.hint}</span>
                ) : null}
              </span>
              <ArrowRight className="size-4 shrink-0 text-faint transition-colors group-hover:text-ink" />
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href={href(params, { results: "1" })}
        className="eyebrow mt-10 inline-block text-[0.5625rem] text-muted transition-colors hover:text-ink"
      >
        Show me what matches so far
      </Link>
    </div>
  );
}
