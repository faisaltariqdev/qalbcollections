"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * Modal and side-panel surfaces built on Radix, which handles focus trapping,
 * scroll locking, `Escape` and `aria-modal` correctly.
 */

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

function Overlay({ className, ...props }: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-obsidian/45 backdrop-blur-[2px] data-[state=closed]:animate-[fade-in_0.2s_reverse] data-[state=open]:animate-[fade-in_0.35s_var(--ease-luxe)]",
        className,
      )}
      {...props}
    />
  );
}

export function DialogContent({
  className,
  children,
  closeLabel = "Close",
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & { closeLabel?: string }) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 max-h-[92dvh] w-[calc(100vw-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-line bg-canvas shadow-panel outline-none data-[state=open]:animate-[fade-up_0.4s_var(--ease-luxe)]",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center bg-canvas/85 text-muted transition-colors hover:text-ink"
          aria-label={closeLabel}
        >
          <X className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

const SIDE_CLASSES = {
  right: "right-0 top-0 h-dvh w-[min(26rem,calc(100vw-2rem))] border-l",
  left: "left-0 top-0 h-dvh w-[min(26rem,calc(100vw-2rem))] border-r",
  top: "left-0 top-0 w-full max-h-[90dvh] border-b",
  bottom: "bottom-0 left-0 w-full max-h-[90dvh] border-t",
} as const;

const SIDE_ANIMATION = {
  right: "data-[state=open]:animate-[slide-from-right_0.42s_var(--ease-luxe)]",
  left: "data-[state=open]:animate-[slide-from-left_0.42s_var(--ease-luxe)]",
  top: "data-[state=open]:animate-[slide-from-top_0.42s_var(--ease-luxe)]",
  bottom: "data-[state=open]:animate-[slide-from-bottom_0.42s_var(--ease-luxe)]",
} as const;

export function SheetContent({
  className,
  children,
  side = "right",
  showClose = true,
  closeLabel = "Close",
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
  side?: keyof typeof SIDE_CLASSES;
  showClose?: boolean;
  closeLabel?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 flex flex-col overflow-hidden bg-canvas shadow-panel outline-none",
          SIDE_CLASSES[side],
          SIDE_ANIMATION[side],
          className,
        )}
        {...props}
      >
        {children}
        {showClose ? (
          <DialogPrimitive.Close
            className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center text-muted transition-colors hover:text-ink"
            aria-label={closeLabel}
          >
            <X className="size-4" />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("border-b border-line px-6 py-5 pr-14", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-wrap gap-3 border-t border-line px-6 py-4", className)}
      {...props}
    />
  );
}
