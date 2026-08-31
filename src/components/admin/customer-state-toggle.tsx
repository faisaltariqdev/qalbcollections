"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import { setCustomerActive } from "@/server/actions/admin-customer-actions";

export function CustomerStateToggle({
  customerId,
  active,
  name,
}: {
  customerId: string;
  active: boolean;
  name: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function apply(next: boolean) {
    startTransition(async () => {
      const result = await setCustomerActive({ customerId, active: next });
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      setConfirming(false);
      router.refresh();
    });
  }

  if (active) {
    return (
      <>
        <Button variant="outline" size="sm" onClick={() => setConfirming(true)} disabled={pending}>
          Deactivate account
        </Button>
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          title={`Deactivate ${name}?`}
          description="They will be signed out and unable to sign in again until the account is reactivated. Past orders are unaffected."
          confirmLabel="Deactivate"
          onConfirm={() => apply(false)}
        />
      </>
    );
  }

  return (
    <Button variant="secondary" size="sm" onClick={() => apply(true)} disabled={pending}>
      Reactivate account
    </Button>
  );
}
