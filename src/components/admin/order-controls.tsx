"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/primitives";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  type OrderStatus,
  type PaymentStatus,
} from "@/lib/constants";
import {
  addOrderNote,
  updateOrderStatus,
  updatePaymentStatus,
} from "@/server/actions/admin-order-actions";

/**
 * Order controls.
 *
 * The status list is the set of transitions the server will actually accept, so
 * the operator is never offered a move that will be rejected.
 */
export function OrderControls({
  orderNumber,
  status,
  paymentStatus,
  transitions,
}: {
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  transitions: readonly OrderStatus[];
}) {
  const [nextStatus, setNextStatus] = useState<string>(transitions[0] ?? "");
  const [note, setNote] = useState("");
  const [payment, setPayment] = useState<string>(paymentStatus);
  const [reference, setReference] = useState("");
  const [comment, setComment] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function run(action: () => Promise<{ ok: boolean; message: string }>, after?: () => void) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message);
        after?.();
      } else {
        toast.error(result.message);
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium text-ink">Move this order on</h3>
        {transitions.length === 0 ? (
          <p className="mt-2 text-xs text-muted">
            This order is {ORDER_STATUS_LABELS[status].toLowerCase()} — there is nowhere further to
            take it.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <Field label="New status">
              {({ id }) => (
                <Select id={id} value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>
                  {transitions.map((option) => (
                    <option key={option} value={option}>
                      {ORDER_STATUS_LABELS[option]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Note" hint="Optional, shown on the order timeline">
              {({ id }) => (
                <Input
                  id={id}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="e.g. courier booked, TCS 1234"
                />
              )}
            </Field>
            <Button
              size="sm"
              disabled={pending || !nextStatus}
              onClick={() =>
                run(
                  () => updateOrderStatus({ orderNumber, status: nextStatus, note }),
                  () => setNote(""),
                )
              }
            >
              {pending ? <Spinner className="size-4" /> : null}
              Update status
            </Button>
          </div>
        )}
      </div>

      <div className="border-t border-line pt-7">
        <h3 className="text-sm font-medium text-ink">Payment</h3>
        <div className="mt-4 space-y-4">
          <Field label="State">
            {({ id }) => (
              <Select id={id} value={payment} onChange={(event) => setPayment(event.target.value)}>
                {PAYMENT_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {PAYMENT_STATUS_LABELS[option]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Reference" hint="Transaction id or receipt number">
            {({ id }) => (
              <Input
                id={id}
                value={reference}
                onChange={(event) => setReference(event.target.value)}
              />
            )}
          </Field>
          <Button
            variant="secondary"
            size="sm"
            disabled={pending || payment === paymentStatus}
            onClick={() =>
              run(() => updatePaymentStatus({ orderNumber, paymentStatus: payment, reference }))
            }
          >
            Record payment
          </Button>
        </div>
      </div>

      <div className="border-t border-line pt-7">
        <h3 className="text-sm font-medium text-ink">Add a note</h3>
        <div className="mt-4 space-y-4">
          <Field label="Note">
            {({ id }) => (
              <Textarea
                id={id}
                rows={3}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Anything the next person handling this order should know."
              />
            )}
          </Field>
          <Button
            variant="outline"
            size="sm"
            disabled={pending || comment.trim().length < 2}
            onClick={() =>
              run(
                () => addOrderNote({ orderNumber, message: comment }),
                () => setComment(""),
              )
            }
          >
            Add note
          </Button>
        </div>
      </div>
    </div>
  );
}
