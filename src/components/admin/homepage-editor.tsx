"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Field, Input, Switch, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/primitives";
import { saveHomeSection } from "@/server/actions/admin-content-actions";

export interface HomeSectionRow {
  id: string;
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  sortOrder: string;
  enabled: boolean;
}

/**
 * Homepage sections.
 *
 * Each block's copy, order and visibility is editable; what a block *renders*
 * (a product rail, the finder, the newsletter) is fixed in code and identified
 * by its key, which is why the key is shown but not editable.
 */
export function HomepageEditor({
  sections,
  descriptions,
}: {
  sections: HomeSectionRow[];
  descriptions: Record<string, string>;
}) {
  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <SectionCard
          key={section.id}
          section={section}
          description={descriptions[section.key] ?? "A homepage block."}
        />
      ))}
    </div>
  );
}

function SectionCard({
  section,
  description,
}: {
  section: HomeSectionRow;
  description: string;
}) {
  const [values, setValues] = useState(section);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const dirty = (Object.keys(section) as (keyof HomeSectionRow)[]).some(
    (key) => values[key] !== section[key],
  );

  function set<K extends keyof HomeSectionRow>(key: K, value: HomeSectionRow[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function save(overrides?: Partial<HomeSectionRow>) {
    const next = { ...values, ...overrides };
    setValues(next);
    startTransition(async () => {
      const result = await saveHomeSection(next);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      router.refresh();
    });
  }

  return (
    <Panel
      title={values.title || section.key}
      description={description}
      actions={
        <div className="flex items-center gap-3">
          <span className="eyebrow text-[0.5rem] text-faint">
            {values.enabled ? "Shown" : "Hidden"}
          </span>
          <Switch
            checked={values.enabled}
            aria-label={`Show the ${section.key} section`}
            disabled={pending}
            onCheckedChange={(checked) => save({ enabled: checked })}
          />
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <Field label="Eyebrow" hint="The small line above the heading">
          {({ id }) => (
            <Input
              id={id}
              value={values.eyebrow}
              onChange={(event) => set("eyebrow", event.target.value)}
            />
          )}
        </Field>
        <Field label="Heading">
          {({ id }) => (
            <Input
              id={id}
              value={values.title}
              onChange={(event) => set("title", event.target.value)}
            />
          )}
        </Field>
        <Field label="Body" className="lg:col-span-2">
          {({ id }) => (
            <Textarea
              id={id}
              rows={3}
              value={values.body}
              onChange={(event) => set("body", event.target.value)}
            />
          )}
        </Field>
        <Field label="Link label">
          {({ id }) => (
            <Input
              id={id}
              value={values.ctaLabel}
              onChange={(event) => set("ctaLabel", event.target.value)}
            />
          )}
        </Field>
        <Field label="Link target">
          {({ id }) => (
            <Input
              id={id}
              value={values.ctaHref}
              onChange={(event) => set("ctaHref", event.target.value)}
              placeholder="/watches"
            />
          )}
        </Field>
        <Field label="Position" hint="Lower numbers appear higher up the page">
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
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <span className="eyebrow text-[0.5rem] text-faint" data-numeric>
          {section.key}
        </span>
        <Button size="sm" variant="secondary" onClick={() => save()} disabled={pending || !dirty}>
          {pending ? <Spinner className="size-4" /> : null}
          Save section
        </Button>
      </div>
    </Panel>
  );
}
