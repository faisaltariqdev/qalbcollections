import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SignInForm } from "@/components/account/auth-forms";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container, Eyebrow, GiltRule, Section } from "@/components/ui/primitives";
import { getCustomerIdentity } from "@/lib/auth/session";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Sign in",
  description: "Sign in to your Qalb Collections account to see orders and saved pieces.",
  path: "/sign-in",
  noIndex: true,
});

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await getCustomerIdentity()) redirect("/account");

  const { next } = await searchParams;
  // Only same-site paths, so `next` can never be turned into an open redirect.
  const redirectTo = next?.startsWith("/") && !next.startsWith("//") ? next : "/account";

  return (
    <>
      <Breadcrumbs crumbs={[{ name: "Sign in", path: "/sign-in" }]} />
      <Section spacing="default">
        <Container size="narrow">
          <div className="mx-auto max-w-md">
            <Eyebrow className="text-qalb">Your account</Eyebrow>
            <h1 className="mt-5 text-display-md text-ink">Sign in</h1>
            <GiltRule className="mt-7" />
            <p className="mt-6 text-sm leading-loose text-muted">
              Your orders, delivery details and saved pieces, in one place.
            </p>
            <div className="mt-11">
              <SignInForm redirectTo={redirectTo} />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
