"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Spinner } from "@/components/ui/primitives";
import { signInAdmin } from "@/server/actions/admin-auth-actions";

export function AdminSignInForm({ redirectTo }: { redirectTo: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await signInAdmin({
        email: form.get("email"),
        password: form.get("password"),
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setError(null);
      toast.success(result.message);
      router.replace(redirectTo);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Field label="Email" required>
        {({ id }) => (
          <Input id={id} name="email" type="email" autoComplete="username" required autoFocus />
        )}
      </Field>

      <Field label="Password" required>
        {({ id }) => (
          <Input id={id} name="password" type="password" autoComplete="current-password" required />
        )}
      </Field>

      {error ? (
        <p role="alert" className="border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      ) : null}

      <Button type="submit" block disabled={pending}>
        {pending ? <Spinner className="size-4" /> : null}
        Sign in
      </Button>
    </form>
  );
}
