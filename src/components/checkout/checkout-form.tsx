"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/primitives";
import { track } from "@/lib/analytics";
import { PAKISTAN_CITIES, type CheckoutFieldErrors } from "@/lib/checkout";
import { formatMoney } from "@/lib/money";
import { previewCoupon, submitCheckout } from "@/server/actions/checkout-actions";

/**
 * Checkout form.
 *
 * One column, no upsells, no distractions. Validation errors come from the same
 * Zod schema the Server Action enforces, and the order total displayed here is
 * always the server's number — a discount is previewed by the server, never
 * calculated in the browser.
 */

export interface CheckoutMethod {
  id: string;
  label: string;
  description: string;
}

export function CheckoutForm({
  methods,
  currency,
  total,
  itemCount,
  defaults,
}: {
  methods: CheckoutMethod[];
  currency: string;
  total: number;
  itemCount: number;
  defaults: { name: string; email: string; phone: string };
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<CheckoutFieldErrors>({});
  const [pending, startTransition] = useTransition();
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState<{ discount: number; total: number } | null>(null);
  const [couponPending, startCouponTransition] = useTransition();
  const [method, setMethod] = useState(methods[0]?.id ?? "");
  const [accepted, setAccepted] = useState(false);

  const payable = applied?.total ?? total;

  function applyCoupon() {
    if (!coupon.trim()) return;
    startCouponTransition(async () => {
      const result = await previewCoupon(coupon.trim());
      if (!result.ok) {
        setApplied(null);
        toast.error(result.message);
        return;
      }
      setApplied({ discount: result.discountTotal, total: result.total });
      toast.success(result.message || "Code applied.");
    });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await submitCheckout({
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        line1: form.get("line1"),
        line2: form.get("line2"),
        city: form.get("city"),
        region: form.get("region"),
        postalCode: form.get("postalCode"),
        notes: form.get("notes"),
        couponCode: applied ? coupon.trim() : "",
        paymentMethod: method,
        acceptTerms: accepted,
      });

      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.message);
        return;
      }

      track("purchase", {
        orderNumber: result.orderNumber,
        value: payable,
        currency,
        itemCount,
      });

      router.push(`/order-success?order=${result.orderNumber}&token=${result.token}`);
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-14">
      <section>
        <h2 className="eyebrow border-b border-line pb-3 text-ink">1 — Your details</h2>
        <div className="mt-7 grid gap-6 sm:grid-cols-2">
          <Field label="Full name" required error={errors.name}>
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

          <Field label="Email" required error={errors.email} hint="For the order confirmation">
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                name="email"
                type="email"
                defaultValue={defaults.email}
                autoComplete="email"
                required
                aria-describedby={describedBy}
                invalid={invalid}
              />
            )}
          </Field>

          <Field
            label="Phone"
            required
            error={errors.phone}
            hint="The courier will call before delivery"
            className="sm:col-span-2"
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                name="phone"
                type="tel"
                inputMode="tel"
                defaultValue={defaults.phone}
                autoComplete="tel"
                required
                aria-describedby={describedBy}
                invalid={invalid}
              />
            )}
          </Field>
        </div>
      </section>

      <section>
        <h2 className="eyebrow border-b border-line pb-3 text-ink">2 — Delivery address</h2>
        <div className="mt-7 grid gap-6 sm:grid-cols-2">
          <Field label="Address" required error={errors.line1} className="sm:col-span-2">
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                name="line1"
                autoComplete="address-line1"
                placeholder="House / flat, street"
                required
                aria-describedby={describedBy}
                invalid={invalid}
              />
            )}
          </Field>

          <Field label="Area or landmark" error={errors.line2} className="sm:col-span-2">
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                name="line2"
                autoComplete="address-line2"
                aria-describedby={describedBy}
                invalid={invalid}
              />
            )}
          </Field>

          <Field label="City" required error={errors.city}>
            {({ id, describedBy, invalid }) => (
              <Select
                id={id}
                name="city"
                required
                aria-describedby={describedBy}
                invalid={invalid}
                defaultValue=""
              >
                <option value="" disabled>
                  Select a city
                </option>
                {PAKISTAN_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field label="Province" error={errors.region}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                name="region"
                autoComplete="address-level1"
                aria-describedby={describedBy}
                invalid={invalid}
              />
            )}
          </Field>

          <Field label="Postal code" error={errors.postalCode}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                name="postalCode"
                inputMode="numeric"
                autoComplete="postal-code"
                aria-describedby={describedBy}
                invalid={invalid}
              />
            )}
          </Field>

          <Field
            label="Delivery notes"
            error={errors.notes}
            hint="Optional — a gate code, a better time of day"
            className="sm:col-span-2"
          >
            {({ id, describedBy, invalid }) => (
              <Textarea
                id={id}
                name="notes"
                rows={3}
                aria-describedby={describedBy}
                invalid={invalid}
              />
            )}
          </Field>
        </div>
      </section>

      <section>
        <h2 className="eyebrow border-b border-line pb-3 text-ink">3 — Payment</h2>

        <fieldset className="mt-7 space-y-3">
          <legend className="sr-only">Payment method</legend>
          {methods.map((option) => (
            <label
              key={option.id}
              className={`flex cursor-pointer items-start gap-3.5 border p-5 transition-colors ${
                method === option.id ? "border-ink bg-shell/60" : "border-line hover:border-ink"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={option.id}
                checked={method === option.id}
                onChange={() => setMethod(option.id)}
                className="mt-1 size-4 shrink-0 accent-[var(--color-ink)]"
              />
              <span>
                <span className="block text-sm font-medium text-ink">{option.label}</span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </fieldset>
        {errors.paymentMethod ? (
          <p role="alert" className="mt-3 text-xs text-danger">
            {errors.paymentMethod}
          </p>
        ) : null}

        {/* Discount code */}
        <div className="mt-8">
          <label htmlFor="coupon" className="eyebrow block text-muted">
            Discount code
          </label>
          <div className="mt-2 flex gap-3">
            <Input
              id="coupon"
              value={coupon}
              onChange={(event) => setCoupon(event.target.value.toUpperCase())}
              placeholder="Optional"
              className="max-w-56"
            />
            <Button
              type="button"
              variant="outline"
              onClick={applyCoupon}
              disabled={couponPending || coupon.trim() === ""}
            >
              {couponPending ? <Spinner className="size-3.5" /> : null}
              Apply
            </Button>
          </div>
          {applied ? (
            <p className="mt-3 text-xs text-success" role="status" data-numeric>
              Discount applied — {formatMoney(applied.discount, currency)} off
            </p>
          ) : null}
        </div>
      </section>

      <section className="border-t border-line pt-8">
        <Checkbox
          checked={accepted}
          onCheckedChange={(state) => setAccepted(state === true)}
          label={
            <>
              I accept the{" "}
              <Link
                href="/terms"
                className="underline decoration-line underline-offset-4 hover:decoration-ink"
              >
                terms
              </Link>{" "}
              and the{" "}
              <Link
                href="/returns-policy"
                className="underline decoration-line underline-offset-4 hover:decoration-ink"
              >
                returns policy
              </Link>
              .
            </>
          }
        />
        {errors.acceptTerms ? (
          <p role="alert" className="mt-3 text-xs text-danger">
            {errors.acceptTerms}
          </p>
        ) : null}

        <Button type="submit" size="lg" block className="mt-8" disabled={pending}>
          {pending ? <Spinner className="size-4" /> : null}
          Place order — {formatMoney(payable, currency)}
        </Button>

        <p className="mt-5 text-xs leading-relaxed text-faint">
          Placing the order does not take payment. We confirm by phone or email, then dispatch.
        </p>
      </section>
    </form>
  );
}
