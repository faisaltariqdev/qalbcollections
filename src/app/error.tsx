"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Container, Eyebrow, GiltRule } from "@/components/ui/primitives";

/**
 * Unhandled error boundary.
 *
 * Shows nothing about the failure itself — a stack trace or database message on
 * screen is both alarming and a disclosure risk. The digest is logged so it can
 * be matched to a server log entry.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error", error.digest ?? error.message);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center bg-canvas">
      <Container size="narrow" className="py-24 text-center">
        <Eyebrow className="text-qalb">Something went wrong</Eyebrow>
        <h1 className="mt-6 font-display text-[clamp(1.75rem,4.5vw,3rem)] font-light leading-[1.08] text-ink">
          We couldn&rsquo;t load this page.
        </h1>
        <GiltRule className="mx-auto mt-9 w-20" />
        <p className="mx-auto mt-8 max-w-md text-base leading-relaxed text-muted">
          The fault is ours, not yours. Try again — and if it keeps happening, tell us and we will
          look into it.
        </p>

        <div className="mt-11 flex flex-wrap justify-center gap-3">
          <Button variant="primary" size="lg" onClick={reset}>
            Try again
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/">Return home</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/contact">Tell us</Link>
          </Button>
        </div>

        {error.digest ? (
          <p className="mt-10 text-xs text-faint" data-numeric>
            Reference {error.digest}
          </p>
        ) : null}
      </Container>
    </main>
  );
}
