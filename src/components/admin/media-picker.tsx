"use client";

import Image from "next/image";
import { useState } from "react";
import { ImagePlus, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

export interface MediaAssetSummary {
  id: string;
  url: string;
  alt: string;
  filename: string;
  width: number | null;
  height: number | null;
}

/**
 * Media library picker.
 *
 * Assets are fetched when the dialog opens rather than with the page, so the
 * product form stays light for the common case of editing copy or stock.
 */
export function MediaPicker({
  onSelect,
  folder = "products",
  label = "Add images",
}: {
  onSelect: (assets: MediaAssetSummary[]) => void;
  folder?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState<MediaAssetSummary[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  function load() {
    setAssets(null);
    fetch("/api/admin/media", { cache: "no-store" })
      .then((response) => (response.ok ? (response.json() as Promise<MediaAssetSummary[]>) : []))
      .then(setAssets)
      .catch(() => setAssets([]));
  }

  function openPicker() {
    setSelected([]);
    setOpen(true);
    load();
  }

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.set("file", file);
        body.set("folder", folder);

        const response = await fetch("/api/admin/media", { method: "POST", body });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { message?: string } | null;
          toast.error(payload?.message ?? `Could not upload ${file.name}.`);
          continue;
        }

        const asset = (await response.json()) as MediaAssetSummary;
        setAssets((current) => [asset, ...(current ?? [])]);
        setSelected((current) => [...current, asset.id]);
      }
    } finally {
      setUploading(false);
    }
  }

  function confirm() {
    const chosen = (assets ?? []).filter((asset) => selected.includes(asset.id));
    if (chosen.length === 0) {
      toast.error("Choose at least one image.");
      return;
    }
    onSelect(chosen);
    setOpen(false);
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={openPicker}>
        <ImagePlus />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <div className="border-b border-line px-7 py-5">
            <DialogTitle className="font-display text-xl font-light text-ink">
              Media library
            </DialogTitle>
            <DialogDescription className="mt-1.5 text-xs text-muted">
              Images are stored exactly as supplied. JPEG, PNG, WebP or AVIF, up to 12 MB.
            </DialogDescription>
          </div>

          <div className="px-7 py-6">
            <label
              className={cn(
                "flex cursor-pointer items-center justify-center gap-3 border border-dashed border-line px-4 py-6 text-sm text-muted transition-colors hover:border-ink hover:text-ink",
                uploading && "pointer-events-none opacity-60",
              )}
            >
              {uploading ? <Spinner className="size-4" /> : <Upload className="size-4" />}
              {uploading ? "Uploading…" : "Upload new images"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                className="sr-only"
                onChange={(event) => void upload(event.target.files)}
              />
            </label>

            <div className="mt-6 max-h-[46vh] overflow-y-auto">
              {assets === null ? (
                <p className="py-10 text-center text-sm text-muted">Loading library…</p>
              ) : assets.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted">
                  Nothing in the library yet. Upload the first image above.
                </p>
              ) : (
                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                  {assets.map((asset) => {
                    const active = selected.includes(asset.id);
                    return (
                      <li key={asset.id}>
                        <button
                          type="button"
                          onClick={() =>
                            setSelected((current) =>
                              active
                                ? current.filter((id) => id !== asset.id)
                                : [...current, asset.id],
                            )
                          }
                          aria-pressed={active}
                          className={cn(
                            "group block w-full border p-1 text-left transition-colors",
                            active ? "border-ink" : "border-line hover:border-ink/40",
                          )}
                        >
                          <span className="relative block aspect-square overflow-hidden bg-shell">
                            <Image
                              src={asset.url}
                              alt=""
                              fill
                              sizes="140px"
                              quality={75}
                              className="object-cover"
                            />
                          </span>
                          <span className="mt-1.5 block truncate px-1 text-[0.625rem] text-faint">
                            {asset.filename}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-line px-7 py-4">
            <p className="text-xs text-muted" data-numeric>
              {selected.length} selected
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={confirm} disabled={selected.length === 0}>
                Add to product
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
