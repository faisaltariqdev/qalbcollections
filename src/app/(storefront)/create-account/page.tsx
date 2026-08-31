import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { RegisterForm } from "@/components/account/auth-forms";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Container, Eyebrow, GiltRule, Section } from "@/components/ui/primitives";
import { getCustomerIdentity } from "@/lib/auth/session";
import { buildMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Create an account",
  description:
    "Create a Qalb Collections account to track orders, keep a wishlist and check out faster.",
  path: "/create-account",
  noIndex: true,
});

const BENEFITS = [
  "Track every order from confirmation to delivery",
  "Keep a wishlist that follows you between devices",
  "Check out without retyping your delivery details",
];

export default async function CreateAccountPage() {
  if (await getCustomerIdentity()) redirect("/account");

  return (
    <>
      <Breadcrumbs crumbs={[{ name: "Create an account", path: "/create-account" }]} />
      <Section spacing="default">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-24">
            <div>
              <Eyebrow className="text-qalb">Your account</Eyebrow>
              <h1 className="mt-5 text-display-md text-ink">Create an account</h1>
              <GiltRule className="mt-7" />
              <p className="mt-6 text-sm leading-loose text-muted">
                An account is not required to order — it simply makes the second order easier than
                the first.
              </p>
              <ul className="mt-10 space-y-4 border-t border-line pt-8">
                {BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex gap-4 text-sm leading-relaxed text-ink-soft">
                    <span aria-hidden className="mt-2 h-px w-5 shrink-0 bg-qalb" />
                    {benefit}
                  </li>
                ))}
              </ul>
              <p className="mt-10 text-xs leading-relaxed text-faint">
                By creating an account you agree to our{" "}
                <Link href="/terms" className="text-muted underline underline-offset-4">
                  terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy-policy" className="text-muted underline underline-offset-4">
                  privacy policy
                </Link>
                .
              </p>
            </div>
            <div className="lg:max-w-md">
              <RegisterForm />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
