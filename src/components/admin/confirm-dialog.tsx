"use client";

import { useTransition } from "react";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/primitives";

/**
 * Confirmation for destructive admin actions. Focus is trapped by the dialog
 * primitive, and the confirm button is disabled while the action runs so a
 * double click cannot fire it twice.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" closeLabel={cancelLabel}>
        <div className="p-7">
          <DialogTitle className="font-display text-xl font-light text-ink">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="mt-3 text-sm leading-relaxed text-muted">
              {description}
            </DialogDescription>
          ) : null}

          <div className="mt-8 flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={pending}>
              {cancelLabel}
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await onConfirm();
                  onOpenChange(false);
                })
              }
            >
              {pending ? <Spinner className="size-4" /> : null}
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
