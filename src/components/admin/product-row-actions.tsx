"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Copy, ExternalLink, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteProduct,
  duplicateProduct,
  setProductStatus,
} from "@/server/actions/admin-product-actions";

/**
 * Per-row product actions. Each one calls a Server Action that re-checks
 * permission, so a hidden menu item is a convenience and not a control.
 */
export function ProductRowActions({
  product,
  canDelete,
}: {
  product: { id: string; name: string; slug: string; status: string; hasOrders: boolean };
  canDelete: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function run(action: () => Promise<{ ok: boolean; message: string }>) {
    startTransition(async () => {
      const result = await action();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Actions for ${product.name}`}
          disabled={pending}
          className="flex size-8 items-center justify-center text-muted transition-colors hover:text-ink disabled:opacity-50"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/admin/products/${product.id}`}>
              <Pencil className="size-3.5" />
              Edit
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <a href={`/product/${product.slug}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-3.5" />
              View on site
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {product.status === "ACTIVE" ? (
            <DropdownMenuItem onSelect={() => run(() => setProductStatus(product.id, "DRAFT"))}>
              Unpublish
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => run(() => setProductStatus(product.id, "ACTIVE"))}>
              Publish
            </DropdownMenuItem>
          )}

          <DropdownMenuItem onSelect={() => run(() => duplicateProduct(product.id))}>
            <Copy className="size-3.5" />
            Duplicate
          </DropdownMenuItem>

          {canDelete ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem tone="danger" onSelect={() => setConfirming(true)}>
                <Trash2 className="size-3.5" />
                {product.hasOrders ? "Archive" : "Delete"}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={product.hasOrders ? `Archive ${product.name}?` : `Delete ${product.name}?`}
        description={
          product.hasOrders
            ? "This piece appears in past orders, so it will be archived rather than removed. It will disappear from the storefront."
            : "This piece has never been ordered, so it will be removed permanently. This cannot be undone."
        }
        confirmLabel={product.hasOrders ? "Archive" : "Delete"}
        onConfirm={() => run(() => deleteProduct(product.id))}
      />
    </>
  );
}
