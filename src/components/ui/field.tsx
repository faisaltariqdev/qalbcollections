"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { Check, ChevronDown } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useId } from "react";

import { cn } from "@/lib/utils";

/** Form controls. Every input is reachable by keyboard and labelled explicitly. */

const CONTROL_BASE =
  "w-full border border-line bg-canvas px-3.5 py-2.5 font-sans text-sm text-ink transition-[color,border-color,box-shadow] duration-300 ease-[var(--ease-luxe)] placeholder:text-faint hover:border-champ/45 focus:border-champ focus:outline-none focus:shadow-[0_0_0_3px_rgba(197,160,89,0.14)] disabled:cursor-not-allowed disabled:bg-ivory-deep/50 disabled:text-faint";

export function Label({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn("eyebrow block text-muted", className)}
      {...props}
    />
  );
}

export interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (props: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
  className?: string;
}

/**
 * Wires label, hint and error text to a control with the right ARIA
 * attributes, so accessibility is the default rather than a per-form chore.
 */
export function Field({ label, hint, error, required, children, className }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <Label htmlFor={id}>
          {label}
          {required ? <span className="ml-1 text-qalb">*</span> : null}
        </Label>
      ) : null}
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={errorId} className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({
  className,
  invalid,
  ...props
}: ComponentProps<"input"> & { invalid?: boolean }) {
  return (
    <input
      className={cn(CONTROL_BASE, invalid && "border-danger", className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Textarea({
  className,
  invalid,
  ...props
}: ComponentProps<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea
      className={cn(CONTROL_BASE, "min-h-28 resize-y leading-relaxed", invalid && "border-danger", className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

/**
 * A native `<select>`. It is keyboard- and screen-reader-correct for free, and
 * on mobile it uses the platform picker, which beats any custom listbox.
 */
export function Select({
  className,
  invalid,
  children,
  ...props
}: ComponentProps<"select"> & { invalid?: boolean }) {
  return (
    <div className="relative">
      <select
        className={cn(
          CONTROL_BASE,
          "cursor-pointer appearance-none pr-10",
          invalid && "border-danger",
          className,
        )}
        aria-invalid={invalid || undefined}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
      />
    </div>
  );
}

export function Checkbox({
  className,
  label,
  ...props
}: ComponentProps<typeof CheckboxPrimitive.Root> & { label?: ReactNode }) {
  const id = useId();
  return (
    <div className="flex items-center gap-3">
      <CheckboxPrimitive.Root
        id={id}
        className={cn(
          "flex size-[18px] shrink-0 items-center justify-center border border-line bg-canvas transition-colors hover:border-ink data-[state=checked]:border-ink data-[state=checked]:bg-ink",
          className,
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator>
          <Check className="size-3 text-canvas" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label ? (
        <LabelPrimitive.Root htmlFor={id} className="cursor-pointer text-sm text-ink-soft">
          {label}
        </LabelPrimitive.Root>
      ) : null}
    </div>
  );
}

export function Switch({ className, ...props }: ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full border border-line bg-shell-deep transition-colors data-[state=checked]:border-ink data-[state=checked]:bg-ink",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-3.5 translate-x-[3px] rounded-full bg-canvas shadow-sm transition-transform duration-300 ease-[var(--ease-luxe)] data-[state=checked]:translate-x-[19px]" />
    </SwitchPrimitive.Root>
  );
}

export const RadioGroup = RadioGroupPrimitive.Root;

export function RadioCard({
  value,
  title,
  description,
  className,
}: {
  value: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div
      className={cn(
        "flex items-start gap-3 border border-line p-4 transition-colors hover:border-ink has-[[data-state=checked]]:border-ink has-[[data-state=checked]]:bg-shell/60",
        className,
      )}
    >
      <RadioGroupPrimitive.Item
        id={id}
        value={value}
        className="mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border border-line bg-canvas data-[state=checked]:border-ink"
      >
        <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-ink" />
      </RadioGroupPrimitive.Item>
      <LabelPrimitive.Root htmlFor={id} className="cursor-pointer">
        <span className="block text-sm font-medium text-ink">{title}</span>
        {description ? (
          <span className="mt-1 block text-xs leading-relaxed text-muted">{description}</span>
        ) : null}
      </LabelPrimitive.Root>
    </div>
  );
}
