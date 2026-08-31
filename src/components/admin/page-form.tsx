"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/primitives";
import type { PageFormValues } from "@/lib/admin/content-schema";
import { slugify } from "@/lib/utils";
import { savePage } from "@/server/actions/admin-content-actions";

export function PageForm({ pageId, initial }: { pageId?: string; initial: PageFormValues }) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function set<K extends keyof PageFormValues>(key: K, value: PageFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    startTransition(async () => {
      const result = await savePage(values, pageId);
      setErrors(result.fieldErrors ?? {});
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      if (!pageId && result.id) router.push(`/admin/pages/${result.id}`);
      else router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <Panel title="Content">
        <div className="space-y-5">
          <Field label="Title" required error={errors.title}>
            {({ id, invalid }) => (
              <Input
                id={id}
                invalid={invalid}
                value={values.title}
                onChange={(event) => {
                  const title = event.target.value;
                  setValues((current) => ({
                    ...current,
                    title,
                    slug: pageId ? current.slug : slugify(title),
                  }));
                }}
              />
            )}
          </Field>

          <Field label="URL slug" required error={errors.slug} hint={`/${values.slug || "…"}`}>
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
            label="Body"
            required
            hint="Markdown: # headings, - lists, **bold**, [links](/url)"
            error={errors.body}
          >
            {({ id, invalid }) => (
              <Textarea
                id={id}
                invalid={invalid}
                rows={26}
                className="font-mono text-[0.8125rem]"
                value={values.body}
                onChange={(event) => set("body", event.target.value)}
              />
            )}
          </Field>
        </div>
      </Panel>

      <div className="space-y-6">
        <Panel title="Publishing">
          <div className="space-y-5">
            <Field label="Status">
              {({ id }) => (
                <Select
                  id={id}
                  value={values.status}
                  onChange={(event) => set("status", event.target.value as "ACTIVE" | "DRAFT")}
                >
                  <option value="ACTIVE">Published</option>
                  <option value="DRAFT">Draft</option>
                </Select>
              )}
            </Field>
            <Field label="SEO title" hint={`${values.seoTitle.length}/70`}>
              {({ id }) => (
                <Input
                  id={id}
                  value={values.seoTitle}
                  onChange={(event) => set("seoTitle", event.target.value)}
                  placeholder={values.title}
                />
              )}
            </Field>
            <Field label="Meta description" hint={`${values.seoDescription.length}/180`}>
              {({ id }) => (
                <Textarea
                  id={id}
                  rows={3}
                  value={values.seoDescription}
                  onChange={(event) => set("seoDescription", event.target.value)}
                />
              )}
            </Field>
            <Field label="Canonical URL">
              {({ id }) => (
                <Input
                  id={id}
                  value={values.canonicalUrl}
                  onChange={(event) => set("canonicalUrl", event.target.value)}
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

        <div className="sticky bottom-6 border border-line bg-canvas p-5 shadow-sm">
          <Button onClick={submit} disabled={pending} className="w-full">
            {pending ? <Spinner className="size-4" /> : null}
            {pageId ? "Save changes" : "Create page"}
          </Button>
        </div>
      </div>
    </div>
  );
}
