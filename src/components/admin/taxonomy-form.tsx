"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { MediaPicker } from "@/components/admin/media-picker";
import { Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/primitives";
import type { TaxonomyFormValues } from "@/lib/admin/taxonomy-schema";
import { CATEGORY_STATUSES, type CategoryStatus } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import { saveCategory, saveCollection } from "@/server/actions/admin-taxonomy-actions";

const STATUS_HINTS: Record<CategoryStatus, string> = {
  ACTIVE: "Live, with its products on sale.",
  COMING_SOON: "Visible with a teaser page; no products can be bought.",
  HIDDEN: "Not shown anywhere on the storefront.",
};

/**
 * One editor for categories and collections. They differ only in whether a
 * parent can be chosen, so the difference is a prop rather than a second file.
 */
export function TaxonomyForm({
  kind,
  initial,
  recordId,
  parents,
}: {
  kind: "category" | "collection";
  initial: TaxonomyFormValues;
  recordId?: string;
  parents?: { id: string; name: string }[];
}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function set<K extends keyof TaxonomyFormValues>(key: K, value: TaxonomyFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    startTransition(async () => {
      const save = kind === "category" ? saveCategory : saveCollection;
      const result = await save(values, recordId);
      setErrors(result.fieldErrors ?? {});
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      if (!recordId && result.id) {
        router.push(`/admin/${kind === "category" ? "categories" : "collections"}/${result.id}`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <Panel title="Basics">
          <div className="space-y-5">
            <Field label="Name" required error={errors.name}>
              {({ id, invalid }) => (
                <Input
                  id={id}
                  invalid={invalid}
                  value={values.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    setValues((current) => ({
                      ...current,
                      name,
                      // Keep the slug in step until it has been saved once;
                      // after that the URL is public and must not shift.
                      slug: recordId ? current.slug : slugify(name),
                    }));
                  }}
                />
              )}
            </Field>

            <Field
              label="URL slug"
              required
              error={errors.slug}
              hint={`/${kind === "category" ? "category" : "collection"}/${values.slug || "…"}`}
            >
              {({ id, invalid }) => (
                <Input
                  id={id}
                  invalid={invalid}
                  value={values.slug}
                  onChange={(event) => set("slug", event.target.value)}
                />
              )}
            </Field>

            <Field
              label="Short description"
              hint="One or two lines, used on listing cards and in search results"
              error={errors.description}
            >
              {({ id }) => (
                <Textarea
                  id={id}
                  rows={2}
                  value={values.description}
                  onChange={(event) => set("description", event.target.value)}
                />
              )}
            </Field>

            <Field
              label="Editorial introduction"
              hint="The longer copy at the top of the listing page"
              error={errors.editorialIntro}
            >
              {({ id }) => (
                <Textarea
                  id={id}
                  rows={5}
                  value={values.editorialIntro}
                  onChange={(event) => set("editorialIntro", event.target.value)}
                />
              )}
            </Field>
          </div>
        </Panel>

        <Panel title="Image" description="Used on the listing header and in navigation.">
          <div className="flex flex-wrap items-start gap-5">
            {values.imageUrl ? (
              <div className="relative">
                <Image
                  src={values.imageUrl}
                  alt=""
                  width={160}
                  height={200}
                  quality={75}
                  className="h-50 w-40 border border-line object-cover"
                />
                <button
                  type="button"
                  onClick={() => set("imageUrl", "")}
                  className="eyebrow mt-2 block text-[0.5rem] text-muted hover:text-danger"
                >
                  Remove
                </button>
              </div>
            ) : null}
            <MediaPicker
              folder={kind === "category" ? "categories" : "collections"}
              label={values.imageUrl ? "Replace image" : "Choose image"}
              onSelect={(assets) => {
                if (assets[0]) set("imageUrl", assets[0].url);
              }}
            />
          </div>
        </Panel>

        <Panel
          title="Search appearance"
          description="Leave blank and sensible defaults are generated from the name and description."
        >
          <div className="space-y-5">
            <Field label="SEO title" hint={`${values.seoTitle.length}/70`} error={errors.seoTitle}>
              {({ id }) => (
                <Input
                  id={id}
                  value={values.seoTitle}
                  onChange={(event) => set("seoTitle", event.target.value)}
                />
              )}
            </Field>
            <Field
              label="Meta description"
              hint={`${values.seoDescription.length}/180`}
              error={errors.seoDescription}
            >
              {({ id }) => (
                <Textarea
                  id={id}
                  rows={3}
                  value={values.seoDescription}
                  onChange={(event) => set("seoDescription", event.target.value)}
                />
              )}
            </Field>
            <Field label="Canonical URL" hint="Only if this page duplicates another">
              {({ id }) => (
                <Input
                  id={id}
                  value={values.canonicalUrl}
                  onChange={(event) => set("canonicalUrl", event.target.value)}
                />
              )}
            </Field>
            <Field label="Social share image" hint="Falls back to the image above">
              {({ id }) => (
                <Input
                  id={id}
                  value={values.ogImageUrl}
                  onChange={(event) => set("ogImageUrl", event.target.value)}
                />
              )}
            </Field>
            <Checkbox
              checked={values.noIndex}
              onCheckedChange={(checked) => set("noIndex", checked === true)}
              label="Ask search engines not to index this page"
            />
          </div>
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel title="Visibility">
          <div className="space-y-5">
            <Field label="Status" hint={STATUS_HINTS[values.status]}>
              {({ id }) => (
                <Select
                  id={id}
                  value={values.status}
                  onChange={(event) => set("status", event.target.value as CategoryStatus)}
                >
                  {CATEGORY_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status === "COMING_SOON" ? "Coming soon" : status === "ACTIVE" ? "Active" : "Hidden"}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            {parents ? (
              <Field label="Sits under" hint="Leave empty for a top-level category">
                {({ id }) => (
                  <Select
                    id={id}
                    value={values.parentId}
                    onChange={(event) => set("parentId", event.target.value)}
                  >
                    <option value="">Top level</option>
                    {parents
                      .filter((parent) => parent.id !== recordId)
                      .map((parent) => (
                        <option key={parent.id} value={parent.id}>
                          {parent.name}
                        </option>
                      ))}
                  </Select>
                )}
              </Field>
            ) : null}

            <Field label="Sort order" hint="Lower numbers come first">
              {({ id }) => (
                <Input
                  id={id}
                  type="number"
                  min={0}
                  value={values.sortOrder}
                  onChange={(event) => set("sortOrder", event.target.value)}
                />
              )}
            </Field>

            <Checkbox
              checked={values.featured}
              onCheckedChange={(checked) => set("featured", checked === true)}
              label="Feature on the homepage"
            />
          </div>
        </Panel>

        <div className="sticky bottom-6 border border-line bg-canvas p-5 shadow-sm">
          <Button onClick={submit} disabled={pending} className="w-full">
            {pending ? <Spinner className="size-4" /> : null}
            {recordId ? "Save changes" : `Create ${kind}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
