"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input } from "@/components/ui/field";
import { Spinner } from "@/components/ui/primitives";
import { changePassword, updateProfile } from "@/server/actions/auth-actions";

type Errors = Partial<Record<string, string>>;

export function ProfileForm({
  defaults,
}: {
  defaults: { name: string; email: string; phone: string; marketingOptIn: boolean };
}) {
  const [errors, setErrors] = useState<Errors>({});
  const [optIn, setOptIn] = useState(defaults.marketingOptIn);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateProfile({
        name: form.get("name"),
        phone: form.get("phone"),
        marketingOptIn: optIn,
      });

      setErrors(result.fieldErrors ?? {});
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Field label="Your name" required error={errors.name}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="name"
            defaultValue={defaults.name}
            autoComplete="name"
            required
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <Field label="Email" hint="Contact us if you need your email changed.">
        {({ id, describedBy }) => (
          <Input id={id} value={defaults.email} readOnly disabled aria-describedby={describedBy} />
        )}
      </Field>

      <Field label="Phone" error={errors.phone}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="phone"
            type="tel"
            inputMode="tel"
            defaultValue={defaults.phone}
            autoComplete="tel"
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <Checkbox
        checked={optIn}
        onCheckedChange={(state) => setOptIn(state === true)}
        label="Email me when something worth knowing about arrives."
      />

      <Button type="submit" disabled={pending}>
        {pending ? <Spinner className="size-4" /> : null}
        Save changes
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);

    startTransition(async () => {
      const result = await changePassword({
        currentPassword: form.get("currentPassword"),
        newPassword: form.get("newPassword"),
      });

      setErrors(result.fieldErrors ?? {});
      if (result.ok) {
        toast.success(result.message);
        element.reset();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Field label="Current password" required error={errors.currentPassword}>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <Field
        label="New password"
        required
        hint="At least 10 characters, with an uppercase letter and a number"
        error={errors.newPassword}
      >
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? <Spinner className="size-4" /> : null}
        Change password
      </Button>
    </form>
  );
}
