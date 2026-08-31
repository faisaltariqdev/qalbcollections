"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Panel, StatusPill, TableWrap, Td, Th } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select } from "@/components/ui/field";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/primitives";
import { ATTRIBUTE_TYPES, type AttributeType } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import {
  deleteAttributeDefinition,
  saveAttributeDefinition,
} from "@/server/actions/admin-taxonomy-actions";

export interface AttributeRow {
  id: string;
  key: string;
  label: string;
  unit: string | null;
  type: string;
  group: string | null;
  filterable: boolean;
  comparable: boolean;
  showInSpecs: boolean;
  sortOrder: number;
  usedBy: number;
}

interface Draft {
  id?: string;
  key: string;
  label: string;
  unit: string;
  type: AttributeType;
  group: string;
  filterable: boolean;
  comparable: boolean;
  showInSpecs: boolean;
  sortOrder: string;
}

const BLANK: Draft = {
  key: "",
  label: "",
  unit: "",
  type: "TEXT",
  group: "",
  filterable: false,
  comparable: false,
  showInSpecs: true,
  sortOrder: "0",
};

const TYPE_HINTS: Record<AttributeType, string> = {
  TEXT: "Free text, e.g. “Sapphire crystal”. Filters become checkboxes of the values in use.",
  NUMBER: "A number with an optional unit, e.g. 41 mm. Supports range filters and sorting.",
  ENUM: "A short fixed vocabulary, e.g. Automatic / Quartz.",
  BOOLEAN: "Yes or no, e.g. date window.",
};

/**
 * Declares what a category's products can specify.
 *
 * This is the category engine's front door: adding “Fragrance Family” here is
 * what makes perfumes filterable and gives them a specification table, with no
 * frontend change.
 */
export function AttributeEditor({
  categoryId,
  definitions,
}: {
  categoryId: string;
  definitions: AttributeRow[];
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function submit() {
    if (!draft) return;
    startTransition(async () => {
      const result = await saveAttributeDefinition({ ...draft, categoryId });
      setErrors(result.fieldErrors ?? {});
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setDraft(null);
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteAttributeDefinition(id);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      router.refresh();
    });
  }

  return (
    <Panel
      title="Specifications"
      description="What products in this category can describe about themselves. Filters, the specification table and comparison are all built from this list."
      actions={
        <Button size="sm" variant="secondary" onClick={() => setDraft({ ...BLANK })}>
          <Plus className="size-4" />
          Add
        </Button>
      }
    >
      {definitions.length === 0 ? (
        <p className="text-sm leading-relaxed text-muted">
          Nothing declared yet. Products in this category will have no specification table and no
          filters of their own.
        </p>
      ) : (
        <TableWrap>
          <thead>
            <tr>
              <Th>Specification</Th>
              <Th>Type</Th>
              <Th>Shown as</Th>
              <Th className="text-right">In use</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {definitions.map((definition) => (
              <tr key={definition.id}>
                <Td>
                  <button
                    type="button"
                    className="text-left text-ink hover:underline"
                    onClick={() =>
                      setDraft({
                        id: definition.id,
                        key: definition.key,
                        label: definition.label,
                        unit: definition.unit ?? "",
                        type: definition.type as AttributeType,
                        group: definition.group ?? "",
                        filterable: definition.filterable,
                        comparable: definition.comparable,
                        showInSpecs: definition.showInSpecs,
                        sortOrder: String(definition.sortOrder),
                      })
                    }
                  >
                    {definition.label}
                  </button>
                  <span className="mt-0.5 block text-xs text-faint" data-numeric>
                    {definition.key}
                    {definition.unit ? ` · ${definition.unit}` : ""}
                    {definition.group ? ` · ${definition.group}` : ""}
                  </span>
                </Td>
                <Td className="text-xs">{definition.type}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1.5">
                    {definition.showInSpecs ? <StatusPill>Specs</StatusPill> : null}
                    {definition.filterable ? <StatusPill tone="accent">Filter</StatusPill> : null}
                    {definition.comparable ? <StatusPill tone="accent">Compare</StatusPill> : null}
                  </div>
                </Td>
                <Td className="text-right" data-numeric>
                  {definition.usedBy}
                </Td>
                <Td>
                  <button
                    type="button"
                    aria-label={`Remove ${definition.label}`}
                    disabled={pending}
                    onClick={() => remove(definition.id)}
                    className="text-muted transition-colors hover:text-danger disabled:opacity-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <Dialog open={draft !== null} onOpenChange={(open) => (open ? null : setDraft(null))}>
        <DialogContent className="max-w-lg">
          {draft ? (
            <div className="p-7">
              <DialogTitle className="font-display text-xl font-light text-ink">
                {draft.id ? "Edit specification" : "Add specification"}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-muted">
                {TYPE_HINTS[draft.type]}
              </DialogDescription>

              <div className="mt-6 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Label" required error={errors.label}>
                    {({ id, invalid }) => (
                      <Input
                        id={id}
                        invalid={invalid}
                        value={draft.label}
                        onChange={(event) => {
                          const label = event.target.value;
                          setDraft((current) =>
                            current
                              ? {
                                  ...current,
                                  label,
                                  key: current.id
                                    ? current.key
                                    : slugify(label).replaceAll("-", "_"),
                                }
                              : current,
                          );
                        }}
                      />
                    )}
                  </Field>
                  <Field
                    label="Key"
                    required
                    hint="Stable identifier used in filter URLs"
                    error={errors.key}
                  >
                    {({ id, invalid }) => (
                      <Input
                        id={id}
                        invalid={invalid}
                        value={draft.key}
                        onChange={(event) => set("key", event.target.value)}
                      />
                    )}
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Type">
                    {({ id }) => (
                      <Select
                        id={id}
                        value={draft.type}
                        onChange={(event) => set("type", event.target.value as AttributeType)}
                      >
                        {ATTRIBUTE_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </Select>
                    )}
                  </Field>
                  <Field label="Unit" hint="e.g. mm, m, ml">
                    {({ id }) => (
                      <Input
                        id={id}
                        value={draft.unit}
                        onChange={(event) => set("unit", event.target.value)}
                      />
                    )}
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Group" hint="Heading in the specification table">
                    {({ id }) => (
                      <Input
                        id={id}
                        value={draft.group}
                        onChange={(event) => set("group", event.target.value)}
                        placeholder="e.g. Movement"
                      />
                    )}
                  </Field>
                  <Field label="Sort order">
                    {({ id }) => (
                      <Input
                        id={id}
                        type="number"
                        min={0}
                        value={draft.sortOrder}
                        onChange={(event) => set("sortOrder", event.target.value)}
                      />
                    )}
                  </Field>
                </div>

                <div className="space-y-3">
                  <Checkbox
                    checked={draft.showInSpecs}
                    onCheckedChange={(checked) => set("showInSpecs", checked === true)}
                    label="Show in the specification table"
                  />
                  <Checkbox
                    checked={draft.filterable}
                    onCheckedChange={(checked) => set("filterable", checked === true)}
                    label="Offer as a filter on the listing page"
                  />
                  <Checkbox
                    checked={draft.comparable}
                    onCheckedChange={(checked) => set("comparable", checked === true)}
                    label="Include in side-by-side comparison"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <Button variant="ghost" size="sm" onClick={() => setDraft(null)} disabled={pending}>
                  Cancel
                </Button>
                <Button size="sm" onClick={submit} disabled={pending}>
                  {pending ? <Spinner className="size-4" /> : null}
                  Save
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Panel>
  );
}
