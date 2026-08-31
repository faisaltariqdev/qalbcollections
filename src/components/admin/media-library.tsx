"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { MediaPicker } from "@/components/admin/media-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { deleteAsset, updateAssetAlt } from "@/server/actions/admin-media-actions";

export interface LibraryAsset {
  id: string;
  url: string;
  filename: string;
  alt: string;
  folder: string;
  width: number | null;
  height: number | null
  sizeBytes: number;
  usedBy: number;
}

/**
 * The library grid. Alt text is edited in place because writing it is the whole
 * point of visiting this screen, and a modal per image would make that tedious.
 */
export function MediaLibrary({ assets, folder }: { assets: LibraryAsset[]; folder?: string }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [removing, setRemoving] = useState<LibraryAsset | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function saveAlt(asset: LibraryAsset) {
    const alt = drafts[asset.id];
    if (alt === undefined || alt === asset.alt) return;
    startTransition(async () => {
      const result = await updateAssetAlt({ id: asset.id, alt });
      if (result.ok) {
        toast.success(result.message);
        setDrafts((current) => {
          const next = { ...current };
          delete next[asset.id];
          return next;
        });
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function confirmDelete() {
    if (!removing) return;
    const asset = removing;
    startTransition(async () => {
      const result = await deleteAsset(asset.id);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      setRemoving(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4 border border-line bg-canvas p-5">
        <p className="text-sm text-muted">
          {assets.length} file{assets.length === 1 ? "" : "s"}
          {folder ? ` in ${folder}` : ""}
        </p>
        <MediaPicker
          folder={folder ?? "products"}
          label="Upload images"
          onSelect={() => router.refresh()}
        />
      </div>

      <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
        {assets.map((asset) => (
          <li key={asset.id} className="border border-line bg-canvas">
            <div className="relative aspect-4/5 bg-shell">
              <Image
                src={asset.url}
                alt={asset.alt}
                fill
                sizes="(min-width: 1280px) 20vw, (min-width: 640px) 30vw, 45vw"
                quality={75}
                className="object-cover"
              />
            </div>

            <div className="space-y-3 p-4">
              <p className="truncate text-xs text-ink-soft" title={asset.filename}>
                {asset.filename}
              </p>
              <p className="text-xs text-faint" data-numeric>
                {asset.width && asset.height ? `${asset.width}×${asset.height} · ` : ""}
                {Math.max(1, Math.round(asset.sizeBytes / 1024))} KB
                {asset.usedBy > 0 ? ` · used ${asset.usedBy}×` : ""}
              </p>

              <div>
                <label className="eyebrow block text-[0.5rem] text-faint" htmlFor={`alt-${asset.id}`}>
                  Alt text
                </label>
                <Input
                  id={`alt-${asset.id}`}
                  className="mt-1.5 px-2.5 py-1.5 text-xs"
                  value={drafts[asset.id] ?? asset.alt}
                  placeholder="Describe the image"
                  onChange={(event) =>
                    setDrafts((current) => ({ ...current, [asset.id]: event.target.value }))
                  }
                  onBlur={() => saveAlt(asset)}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="px-0 text-[0.5625rem]"
                  disabled={pending || drafts[asset.id] === undefined}
                  onClick={() => saveAlt(asset)}
                >
                  Save
                </Button>
                <button
                  type="button"
                  aria-label={`Delete ${asset.filename}`}
                  onClick={() => setRemoving(asset)}
                  className="text-muted transition-colors hover:text-danger"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => (open ? null : setRemoving(null))}
        title="Delete this file?"
        description={
          removing?.usedBy
            ? "This image is still in use, so the delete will be refused. Remove it from those places first."
            : "The file is removed from the library and from disk. This cannot be undone."
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </>
  );
}
