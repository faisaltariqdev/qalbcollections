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
import {
  CONTENT_STATUSES,
  type ContentStatus,
  type JournalFormValues,
} from "@/lib/admin/content-schema";
import { slugify } from "@/lib/utils";
import { saveJournalPost } from "@/server/actions/admin-content-actions";

const CATEGORIES = ["Guides", "Care", "Stories", "Styling", "Gifting"];

/** Roughly 200 words a minute, rounded up, as a starting point the editor can override. */
function estimateMinutes(body: string) {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function JournalForm({
  postId,
  initial,
}: {
  postId?: string;
  initial: JournalFormValues;
}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function set<K extends keyof JournalFormValues>(key: K, value: JournalFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function submit() {
    startTransition(async () => {
      const result = await saveJournalPost(values, postId);
      setErrors(result.fieldErrors ?? {});
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      if (!postId && result.id) router.push(`/admin/journal/${result.id}`);
      else router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <Panel title="The piece">
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
                      slug: postId ? current.slug : slugify(title),
                    }));
                  }}
                />
              )}
            </Field>

            <Field
              label="URL slug"
              required
              error={errors.slug}
              hint={`/journal/${values.slug || "…"}`}
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
              label="Standfirst"
              required
              hint="The one-paragraph summary on the journal index and in search results"
              error={errors.excerpt}
            >
              {({ id, invalid }) => (
                <Textarea
                  id={id}
                  invalid={invalid}
                  rows={3}
                  value={values.excerpt}
                  onChange={(event) => set("excerpt", event.target.value)}
                />
              )}
            </Field>

            <Field
              label="Body"
              required
              hint="Markdown: # headings, - lists, **bold**, [links](/url), > quotes"
              error={errors.body}
            >
              {({ id, invalid }) => (
                <Textarea
                  id={id}
                  invalid={invalid}
                  rows={22}
                  className="font-mono text-[0.8125rem]"
                  value={values.body}
                  onChange={(event) => set("body", event.target.value)}
                />
              )}
            </Field>
          </div>
        </Panel>

        <Panel title="Cover image">
          <div className="flex flex-wrap items-start gap-5">
            {values.coverImage ? (
              <Image
                src={values.coverImage}
                alt=""
                width={240}
                height={150}
                quality={75}
                className="h-37 w-60 border border-line object-cover"
              />
            ) : null}
            <div className="flex-1 space-y-4">
              <MediaPicker
                folder="journal"
                label={values.coverImage ? "Replace" : "Choose image"}
                onSelect={(assets) => {
                  const asset = assets[0];
                  if (!asset) return;
                  setValues((current) => ({
                    ...current,
                    coverImage: asset.url,
                    coverAlt: current.coverAlt || asset.alt,
                  }));
                }}
              />
              <Field label="Alt text" hint="Describe the image for screen readers and search">
                {({ id }) => (
                  <Input
                    id={id}
                    value={values.coverAlt}
                    onChange={(event) => set("coverAlt", event.target.value)}
                  />
                )}
              </Field>
              {values.coverImage ? (
                <button
                  type="button"
                  onClick={() => set("coverImage", "")}
                  className="eyebrow text-[0.5rem] text-muted hover:text-danger"
                >
                  Remove image
                </button>
              ) : null}
            </div>
          </div>
        </Panel>

        <Panel title="Search appearance">
          <div className="space-y-5">
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
                  placeholder={values.excerpt}
                />
              )}
            </Field>
            <Field label="Canonical URL" hint="Only if this was published elsewhere first">
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
              label="Ask search engines not to index this piece"
            />
          </div>
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel title="Publishing">
          <div className="space-y-5">
            <Field label="Status">
              {({ id }) => (
                <Select
                  id={id}
                  value={values.status}
                  onChange={(event) => set("status", event.target.value as ContentStatus)}
                >
                  {CONTENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status === "ACTIVE" ? "Published" : status === "DRAFT" ? "Draft" : "Archived"}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field label="Category">
              {({ id }) => (
                <Select
                  id={id}
                  value={values.category}
                  onChange={(event) => set("category", event.target.value)}
                >
                  {[...new Set([values.category, ...CATEGORIES])].filter(Boolean).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field label="Author">
              {({ id }) => (
                <Input
                  id={id}
                  value={values.authorName}
                  onChange={(event) => set("authorName", event.target.value)}
                />
              )}
            </Field>

            <Field
              label="Reading time"
              hint={`Suggested: ${estimateMinutes(values.body)} min from the current body`}
            >
              {({ id }) => (
                <Input
                  id={id}
                  type="number"
                  min={1}
                  value={values.readMinutes}
                  onChange={(event) => set("readMinutes", event.target.value)}
                />
              )}
            </Field>

            <Checkbox
              checked={values.featured}
              onCheckedChange={(checked) => set("featured", checked === true)}
              label="Feature at the top of the journal"
            />
          </div>
        </Panel>

        <div className="sticky bottom-6 border border-line bg-canvas p-5 shadow-sm">
          <Button onClick={submit} disabled={pending} className="w-full">
            {pending ? <Spinner className="size-4" /> : null}
            {postId ? "Save changes" : "Create post"}
          </Button>
        </div>
      </div>
    </div>
  );
}
