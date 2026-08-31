"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { MediaPicker } from "@/components/admin/media-picker";
import { Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/primitives";
import { saveBanner } from "@/server/actions/admin-banner-actions";

export interface HeroFormValues {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
  ctaLabel: string;
  ctaHref: string;
  ctaLabel2: string;
  ctaHref2: string;
  active: boolean;
}

export function HeroForm({ initial }: { initial: HeroFormValues }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function set<K extends keyof HeroFormValues>(key: K, value: HeroFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    startTransition(async () => {
      const result = await saveBanner({ ...values, placement: "home_hero", sortOrder: 0 });
      setErrors(result.fieldErrors ?? {});
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <Panel title="Copy" description="Keep it short. The image carries most of the weight.">
          <div className="space-y-5">
            <Field label="Eyebrow" hint="A short line above the headline">
              {({ id }) => (
                <Input
                  id={id}
                  value={values.eyebrow}
                  onChange={(event) => set("eyebrow", event.target.value)}
                  placeholder="Qalb Collections"
                />
              )}
            </Field>
            <Field label="Headline" required error={errors.title}>
              {({ id, invalid }) => (
                <Input
                  id={id}
                  invalid={invalid}
                  value={values.title}
                  onChange={(event) => set("title", event.target.value)}
                  placeholder="Timeless precision."
                />
              )}
            </Field>
            <Field label="Subheadline" error={errors.subtitle}>
              {({ id }) => (
                <Textarea
                  id={id}
                  rows={2}
                  value={values.subtitle}
                  onChange={(event) => set("subtitle", event.target.value)}
                />
              )}
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Primary button">
                {({ id }) => (
                  <Input
                    id={id}
                    value={values.ctaLabel}
                    onChange={(event) => set("ctaLabel", event.target.value)}
                    placeholder="Explore watches"
                  />
                )}
              </Field>
              <Field label="Primary link">
                {({ id }) => (
                  <Input
                    id={id}
                    value={values.ctaHref}
                    onChange={(event) => set("ctaHref", event.target.value)}
                    placeholder="/watches"
                  />
                )}
              </Field>
              <Field label="Secondary button">
                {({ id }) => (
                  <Input
                    id={id}
                    value={values.ctaLabel2}
                    onChange={(event) => set("ctaLabel2", event.target.value)}
                    placeholder="Discover Qalb"
                  />
                )}
              </Field>
              <Field label="Secondary link">
                {({ id }) => (
                  <Input
                    id={id}
                    value={values.ctaHref2}
                    onChange={(event) => set("ctaHref2", event.target.value)}
                    placeholder="/about"
                  />
                )}
              </Field>
            </div>
          </div>
        </Panel>

        <Panel
          title="Image"
          description="This is the largest thing a first-time visitor sees, and it is the page's LCP. Use the highest-quality file you have."
        >
          <div className="space-y-5">
            {values.imageUrl ? (
              <div className="relative aspect-video w-full max-w-2xl border border-line">
                <Image
                  src={values.imageUrl}
                  alt={values.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 40rem, 100vw"
                  quality={90}
                  className="object-cover"
                />
              </div>
            ) : (
              <p className="text-sm text-danger">{errors.imageUrl ?? "No image chosen yet."}</p>
            )}

            <MediaPicker
              folder="hero"
              label={values.imageUrl ? "Replace image" : "Choose image"}
              onSelect={(assets) => {
                const asset = assets[0];
                if (!asset) return;
                setValues((current) => ({
                  ...current,
                  imageUrl: asset.url,
                  imageAlt: current.imageAlt || asset.alt,
                }));
              }}
            />

            <Field
              label="Alt text"
              required
              hint="What the image shows, for screen readers and search"
              error={errors.imageAlt}
            >
              {({ id, invalid }) => (
                <Input
                  id={id}
                  invalid={invalid}
                  value={values.imageAlt}
                  onChange={(event) => set("imageAlt", event.target.value)}
                />
              )}
            </Field>
          </div>
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel title="Visibility">
          <Checkbox
            checked={values.active}
            onCheckedChange={(checked) => set("active", checked === true)}
            label="Show the hero on the homepage"
          />
          <p className="mt-3 text-xs leading-relaxed text-muted">
            With the hero off, the homepage opens on the first enabled section instead.
          </p>
        </Panel>

        <div className="sticky bottom-6 border border-line bg-canvas p-5 shadow-sm">
          <Button onClick={submit} disabled={pending} className="w-full">
            {pending ? <Spinner className="size-4" /> : null}
            Save hero
          </Button>
        </div>
      </div>
    </div>
  );
}
