"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/primitives";
import { CONTACT_SUBJECTS, type ContactResult } from "@/lib/contact";
import { submitContactMessage } from "@/server/actions/contact-actions";

/**
 * Contact form.
 *
 * Field-level errors come back from the same Zod schema the server validates
 * with, so the two can never disagree. Submitting goes through a Server Action —
 * no API surface to protect separately.
 */
export function ContactForm() {
  const [errors, setErrors] = useState<ContactResult["fieldErrors"]>({});
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  if (sent) {
    return (
      <div className="border border-line bg-shell px-8 py-12 text-center" role="status">
        <h3 className="font-display text-2xl text-ink">Message received</h3>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted">
          We reply within one working day. If it is urgent, WhatsApp is faster than email.
        </p>
        <Button variant="quiet" size="sm" className="mt-6" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await submitContactMessage({
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        subject: form.get("subject"),
        message: form.get("message"),
      });

      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.message);
        return;
      }

      setErrors({});
      setSent(true);
      toast.success(result.message);
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Your name" required error={errors?.name}>
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

        <Field label="Email" required error={errors?.email}>
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
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Phone" hint="Optional — faster for questions about sizing" error={errors?.phone}>
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

        <Field label="What is it about?" error={errors?.subject}>
          {({ id, describedBy, invalid }) => (
            <Select id={id} name="subject" aria-describedby={describedBy} invalid={invalid}>
              {CONTACT_SUBJECTS.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <Field label="Message" required error={errors?.message}>
        {({ id, describedBy, invalid }) => (
          <Textarea
            id={id}
            name="message"
            rows={6}
            required
            placeholder="Tell us which piece you are looking at, or what you are trying to decide between."
            aria-describedby={describedBy}
            invalid={invalid}
          />
        )}
      </Field>

      <div className="flex flex-wrap items-center gap-5">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Spinner className="size-4" /> : null}
          Send message
        </Button>
        <p className="text-xs leading-relaxed text-faint">
          We use your details only to answer this enquiry.
        </p>
      </div>
    </form>
  );
}
