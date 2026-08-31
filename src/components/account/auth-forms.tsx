"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/field";
import { Spinner } from "@/components/ui/primitives";
import { useWishlist } from "@/hooks/use-wishlist";
import { registerCustomer, signInCustomer } from "@/server/actions/auth-actions";

/**
 * Sign-in and registration.
 *
 * On success the local wishlist is pushed to the account, so a guest who saved
 * pieces before creating an account does not lose them. Errors are whatever the
 * server says — the client never decides whether credentials are valid.
 */

type Errors = Partial<Record<string, string>>;

function useAfterAuth(redirectTo: string) {
  const router = useRouter();
  const { refresh } = useCart();
  const { sync } = useWishlist();

  return async function afterAuth() {
    await sync();
    await refresh();
    router.replace(redirectTo);
    router.refresh();
  };
}

export function SignInForm({ redirectTo = "/account" }: { redirectTo?: string }) {
  const [errors, setErrors] = useState<Errors>({});
  const [pending, startTransition] = useTransition();
  const afterAuth = useAfterAuth(redirectTo);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await signInCustomer({
        email: form.get("email"),
        password: form.get("password"),
      });

      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      await afterAuth();
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Field label="Email" required error={errors.email}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <Field label="Password" required error={errors.password}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? <Spinner className="size-4" /> : null}
        Sign in
      </Button>

      <p className="text-sm text-muted">
        New here?{" "}
        <Link
          href="/create-account"
          className="text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ redirectTo = "/account" }: { redirectTo?: string }) {
  const [errors, setErrors] = useState<Errors>({});
  const [optIn, setOptIn] = useState(false);
  const [pending, startTransition] = useTransition();
  const afterAuth = useAfterAuth(redirectTo);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await registerCustomer({
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        password: form.get("password"),
        marketingOptIn: optIn,
      });

      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      await afterAuth();
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Field label="Your name" required error={errors.name}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="name"
            autoComplete="name"
            required
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <Field label="Email" required error={errors.email}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <Field label="Phone" hint="Optional — helps with delivery" error={errors.phone}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <Field
        label="Password"
        required
        hint="At least 10 characters, with an uppercase letter and a number"
        error={errors.password}
      >
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="password"
            type="password"
            autoComplete="new-password"
            required
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <Checkbox
        checked={optIn}
        onCheckedChange={(state) => setOptIn(state === true)}
        label="Email me when something worth knowing about arrives. No more than monthly."
      />

      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? <Spinner className="size-4" /> : null}
        Create account
      </Button>

      <p className="text-sm text-muted">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="text-ink underline decoration-line underline-offset-4 hover:decoration-ink"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
