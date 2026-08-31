"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Panel, StatusPill, TableWrap, Td, Th } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/field";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/primitives";
import { formatMoney } from "@/lib/money";
import { deleteCoupon, saveCoupon } from "@/server/actions/admin-coupon-actions";

export interface CouponRow {
  id: string;
  code: string;
  description: string | null;
  type: string;
  /** Whole percent for PERCENT, minor units for FIXED. */
  value: number;
  minSubtotal: number;
  maxRedemptions: number | null;
  redemptions: number;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

interface Draft {
  id?: string;
  code: string;
  description: string;
  type: "PERCENT" | "FIXED";
  value: string;
  minSubtotal: string;
  maxRedemptions: string;
  active: boolean;
  startsAt: string;
  endsAt: string;
}

const BLANK: Draft = {
  code: "",
  description: "",
  type: "PERCENT",
  value: "",
  minSubtotal: "0",
  maxRedemptions: "",
  active: true,
  startsAt: "",
  endsAt: "",
};

/** yyyy-mm-dd, which is what `<input type="date">` wants. */
function dateValue(iso: string | null) {
  return iso ? iso.slice(0, 10) : "";
}

export function CouponManager({
  coupons,
  currency,
  divisor,
}: {
  coupons: CouponRow[];
  currency: string;
  /** Minor units per major unit, so the form can show and read major amounts. */
  divisor: number;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function submit() {
    if (!draft) return;
    startTransition(async () => {
      const result = await saveCoupon({ ...draft, currency });
      setErrors(result.fieldErrors ?? {});
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setDraft(null);
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteCoupon(id);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      router.refresh();
    });
  }

  return (
    <Panel
      title="Codes"
      description="Discounts are recalculated on the server at checkout, so a code can never take more off than it should."
      actions={
        <Button size="sm" variant="secondary" onClick={() => setDraft({ ...BLANK })}>
          <Plus className="size-4" />
          New code
        </Button>
      }
    >
      {coupons.length === 0 ? (
        <p className="text-sm text-muted">No codes yet.</p>
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Code</Th>
              <Th>Discount</Th>
              <Th>Minimum</Th>
              <Th>Window</Th>
              <Th className="text-right">Used</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id}>
                <Td>
                  <button
                    type="button"
                    className="text-left text-ink hover:underline"
                    data-numeric
                    onClick={() =>
                      setDraft({
                        id: coupon.id,
                        code: coupon.code,
                        description: coupon.description ?? "",
                        type: coupon.type === "FIXED" ? "FIXED" : "PERCENT",
                        value:
                          coupon.type === "FIXED"
                            ? String(coupon.value / divisor)
                            : String(coupon.value),
                        minSubtotal: String(coupon.minSubtotal / divisor),
                        maxRedemptions: coupon.maxRedemptions
                          ? String(coupon.maxRedemptions)
                          : "",
                        active: coupon.active,
                        startsAt: dateValue(coupon.startsAt),
                        endsAt: dateValue(coupon.endsAt),
                      })
                    }
                  >
                    {coupon.code}
                  </button>
                  {coupon.description ? (
                    <span className="mt-0.5 block text-xs text-faint">{coupon.description}</span>
                  ) : null}
                  {!coupon.active ? (
                    <StatusPill tone="warning">
                      <span className="mt-1 inline-block">Off</span>
                    </StatusPill>
                  ) : null}
                </Td>
                <Td data-numeric>
                  {coupon.type === "PERCENT"
                    ? `${coupon.value}%`
                    : formatMoney(coupon.value, currency)}
                </Td>
                <Td data-numeric>
                  {coupon.minSubtotal > 0 ? formatMoney(coupon.minSubtotal, currency) : "—"}
                </Td>
                <Td className="text-xs text-muted">
                  {coupon.startsAt || coupon.endsAt
                    ? `${dateValue(coupon.startsAt) || "any"} → ${dateValue(coupon.endsAt) || "any"}`
                    : "Always"}
                </Td>
                <Td className="text-right" data-numeric>
                  {coupon.redemptions}
                  {coupon.maxRedemptions ? ` / ${coupon.maxRedemptions}` : ""}
                </Td>
                <Td>
                  <button
                    type="button"
                    aria-label={`Remove ${coupon.code}`}
                    disabled={pending}
                    onClick={() => remove(coupon.id)}
                    className="text-muted transition-colors hover:text-danger disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Dialog open={draft !== null} onOpenChange={(open) => (open ? null : setDraft(null))}>
        <DialogContent className="max-w-lg">
          {draft ? (
            <div className="p-7">
              <DialogTitle className="font-display text-xl font-light text-ink">
                {draft.id ? "Edit code" : "New code"}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-muted">
                Discounts apply to the item subtotal, before delivery.
              </DialogDescription>

              <div className="mt-6 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Code" required error={errors.code}>
                    {({ id, invalid }) => (
                      <Input
                        id={id}
                        invalid={invalid}
                        value={draft.code}
                        onChange={(event) => set("code", event.target.value.toUpperCase())}
                        placeholder="QALB10"
                      />
                    )}
                  </Field>
                  <Field label="Type">
                    {({ id }) => (
                      <Select
                        id={id}
                        value={draft.type}
                        onChange={(event) =>
                          set("type", event.target.value as "PERCENT" | "FIXED")
                        }
                      >
                        <option value="PERCENT">Percentage off</option>
                        <option value="FIXED">Fixed amount off</option>
                      </Select>
                    )}
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field
                    label={draft.type === "PERCENT" ? "Percent off" : `Amount off (${currency})`}
                    required
                    error={errors.value}
                  >
                    {({ id, invalid }) => (
                      <Input
                        id={id}
                        invalid={invalid}
                        type="number"
                        min={0}
                        value={draft.value}
                        onChange={(event) => set("value", event.target.value)}
                      />
                    )}
                  </Field>
                  <Field label={`Minimum order (${currency})`} error={errors.minSubtotal}>
                    {({ id }) => (
                      <Input
                        id={id}
                        type="number"
                        min={0}
                        value={draft.minSubtotal}
                        onChange={(event) => set("minSubtotal", event.target.value)}
                      />
                    )}
                  </Field>
                </div>

                <Field label="Description" hint="Internal note, not shown to customers">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={draft.description}
                      onChange={(event) => set("description", event.target.value)}
                    />
                  )}
                </Field>

                <div className="grid gap-5 sm:grid-cols-3">
                  <Field label="Starts">
                    {({ id }) => (
                      <Input
                        id={id}
                        type="date"
                        value={draft.startsAt}
                        onChange={(event) => set("startsAt", event.target.value)}
                      />
                    )}
                  </Field>
                  <Field label="Ends">
                    {({ id }) => (
                      <Input
                        id={id}
                        type="date"
                        value={draft.endsAt}
                        onChange={(event) => set("endsAt", event.target.value)}
                      />
                    )}
                  </Field>
                  <Field label="Max uses" hint="Blank for unlimited">
                    {({ id }) => (
                      <Input
                        id={id}
                        type="number"
                        min={1}
                        value={draft.maxRedemptions}
                        onChange={(event) => set("maxRedemptions", event.target.value)}
                      />
                    )}
                  </Field>
                </div>

                <Checkbox
                  checked={draft.active}
                  onCheckedChange={(checked) => set("active", checked === true)}
                  label="Accept this code at checkout"
                />
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <Button variant="ghost" size="sm" onClick={() => setDraft(null)} disabled={pending}>
                  Cancel
                </Button>
                <Button size="sm" onClick={submit} disabled={pending}>
                  {pending ? <Spinner className="size-4" /> : null}
                  Save
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
