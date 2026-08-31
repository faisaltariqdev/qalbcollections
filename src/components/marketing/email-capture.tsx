"use client";

import { ArrowRight } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Spinner } from "@/components/ui/primitives";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import {
  requestLaunchNotification,
  subscribeToNewsletter,
} from "@/server/actions/subscribe-actions";

/**
 * Single-field email capture used by the footer newsletter and the perfume
 * "notify me" form. Validation and rate limiting live on the server; this only
 * handles presentation and the success state.
 */
export function EmailCapture({
  intent = "newsletter",
  source = "footer",
  topic = "perfumes",
  placeholder = "Your email address",
  label = "Email address",
  ctaLabel = "Join",
  tone = "light",
  variant = "underline",
  note,
  className,
}: {
  intent?: "newsletter" | "notify";
  source?: string;
  topic?: string;
  placeholder?: string;
  label?: string;
  ctaLabel?: string;
  tone?: "light" | "dark";
  variant?: "underline" | "boxed";
  note?: string;
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const dark = tone === "dark";

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result =
        intent === "notify"
          ? await requestLaunchNotification({ email, topic })
          : await subscribeToNewsletter({ email, source });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      if (intent === "notify") track("notify_me_submitted", { topic });
      else track("newsletter_subscribed", { source });

      setDone(true);
      setEmail("");
      toast.success(result.message);
    });
  }

  if (done) {
    return (
      <p
        className={cn(
          "text-sm leading-relaxed",
          dark ? "text-warm-white/75" : "text-dust",
          className,
        )}
        role="status"
      >
        {intent === "notify"
          ? "You're on the list. We'll write before anyone else hears."
          : "You're subscribed. Watch your inbox."}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("w-full", className)} noValidate>
      <div
        className={cn(
          "flex items-center gap-3 transition-colors",
          variant === "underline"
            ? dark
              ? "border-b border-warm-white/25 focus-within:border-warm-white"
              : "border-b border-line focus-within:border-ink"
            : "border border-warm-white/20 bg-void p-1 focus-within:border-warm-white/40",
        )}
      >
        <label htmlFor={`email-${intent}-${source}`} className="sr-only">
          {label}
        </label>
        <input
          id={`email-${intent}-${source}`}
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `email-error-${intent}-${source}` : undefined}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-sm outline-none",
            dark
              ? "text-warm-white placeholder:text-warm-white/40"
              : "text-ink placeholder:text-ash",
          )}
        />
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "eyebrow flex shrink-0 items-center gap-2 transition-colors disabled:opacity-50",
            variant === "underline" && (dark
              ? "text-warm-white hover:text-champ"
              : "text-ink hover:text-champ"),
            variant === "boxed" && "h-9 w-9 items-center justify-center bg-champ text-void hover:bg-champ-soft",
          )}
          aria-label={ctaLabel || "Subscribe"}
        >
          {pending ? (
            <Spinner className="size-3.5" />
          ) : variant === "boxed" ? (
            <ArrowRight className="size-4" strokeWidth={1.5} />
          ) : (
            <>
              {ctaLabel}
              <ArrowRight className="size-3.5" strokeWidth={1.5} />
            </>
          )}
        </button>
      </div>

      {error ? (
        <p
          id={`email-error-${intent}-${source}`}
          role="alert"
          className={cn("mt-2 text-xs", dark ? "text-champ-soft" : "text-danger")}
        >
          {error}
        </p>
      ) : note ? (
        <p className={cn("mt-3 text-xs leading-relaxed", dark ? "text-warm-white/45" : "text-ash")}>
          {note}
        </p>
      ) : null}
    </form>
  );
}
