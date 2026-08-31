import Link from "next/link";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container, Eyebrow, GiltRule } from "@/components/ui/primitives";

/**
 * 404.
 *
 * Returns the correct status code and offers the three things a lost visitor
 * actually wants: the catalogue, the search, or the way home.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center bg-canvas">
      <Container size="narrow" className="py-24 text-center">
        <Eyebrow className="text-qalb">404</Eyebrow>
        <h1 className="mt-6 font-display text-[clamp(1.875rem,5vw,3.5rem)] font-light leading-[1.05] tracking-[-0.015em] text-ink">
          The piece you&rsquo;re looking for has moved.
        </h1>
        <GiltRule className="mx-auto mt-9 w-20" />
        <p className="mx-auto mt-8 max-w-md text-base leading-relaxed text-muted">
          The page may have been retired along with the piece it described. The catalogue is small
          enough that you will find what you need in a few clicks.
        </p>

        <div className="mt-11 flex flex-wrap justify-center gap-3">
          <Button asChild variant="primary" size="lg">
            <Link href="/watches">Explore watches</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/">Return home</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/search">
              <Search className="size-4" />
              Search
            </Link>
          </Button>
        </div>
      </Container>
    </main>
  );
}
