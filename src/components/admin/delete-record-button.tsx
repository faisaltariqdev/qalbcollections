"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import { deleteJournalPost, deletePage } from "@/server/actions/admin-content-actions";
import { deleteCategory, deleteCollection } from "@/server/actions/admin-taxonomy-actions";

const ACTIONS = {
  journal: deleteJournalPost,
  page: deletePage,
  category: deleteCategory,
  collection: deleteCollection,
} as const;

/**
 * Delete for records where a confirm-and-leave is the whole interaction. The
 * server action decides whether the delete is even allowed — a category with
 * products, for instance, is refused with a reason.
 */
export function DeleteRecordButton({
  kind,
  recordId,
  name,
  redirectTo,
}: {
  kind: keyof typeof ACTIONS;
  recordId: string;
  name: string;
  redirectTo: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} disabled={pending}>
        <Trash2 className="size-4" />
        Delete
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete ${name}?`}
        description="This cannot be undone. If the record is still referenced elsewhere the delete will be refused and nothing will change."
        confirmLabel="Delete"
        onConfirm={() =>
          startTransition(async () => {
            const result = await ACTIONS[kind](recordId);
            if (!result.ok) {
              toast.error(result.message);
              return;
            }
            toast.success(result.message);
            router.push(redirectTo);
          })
        }
      />
    </>
  );
}
