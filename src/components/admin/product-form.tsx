"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { MediaPicker } from "@/components/admin/media-picker";
import { Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Spinner } from "@/components/ui/primitives";
import type { ProductFormValues } from "@/lib/admin/product-schema";
export type { ProductFormValues };
import { PRODUCT_STATUSES } from "@/lib/constants";
import { slugify } from "@/lib/utils";
import { saveProduct } from "@/server/actions/admin-product-actions";

/**
 * Product editor.
 *
 * Specification fields are not hard-coded: they come from the selected
 * category's attribute definitions, so adding perfumes or jewellery is data
 * entry rather than a code change. Validation is the same Zod schema the
 * Server Action uses, so the browser and the server agree.
 */

export interface AttributeDefinitionOption {
  id: string;
  key: string;
  label: string;
  unit: string | null;
  type: string;
  group: string | null;
}

export interface ProductFormOptions {
  categories: { id: string; name: string; slug: string; attributes: AttributeDefinitionOption[] }[];
  collections: { id: string; name: string }[];
  tags: { id: string; label: string; kind: string }[];
}

export function ProductForm({
  productId,
  initial,
  options,
}: {
  productId?: string;
  initial: ProductFormValues;
  options: ProductFormOptions;
}) {
  const [values, setValues] = useState<ProductFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const category = options.categories.find((entry) => entry.id === values.categoryId);
  const definitions = category?.attributes ?? [];

  const attributeValues = useMemo(() => {
    const map = new Map(values.attributes.map((attribute) => [attribute.definitionId, attribute.value]));
    return map;
  }, [values.attributes]);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function setAttribute(definitionId: string, value: string) {
    setValues((current) => {
      const rest = current.attributes.filter((entry) => entry.definitionId !== definitionId);
      return { ...current, attributes: [...rest, { definitionId, value }] };
    });
  }

  function moveImage(index: number, direction: -1 | 1) {
    setValues((current) => {
      const next = [...current.images];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return { ...current, images: next };
    });
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await saveProduct(values, productId);

      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.message);
        return;
      }

      setErrors({});
      toast.success(result.message);

      if (!productId && result.id) router.replace(`/admin/products/${result.id}`);
      else router.refresh();
    });
  }

  const tagsByKind = options.tags.reduce<Record<string, typeof options.tags>>((groups, tag) => {
    (groups[tag.kind] ??= []).push(tag);
    return groups;
  }, {});

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6 pb-24">
      {errors.form ? (
        <p role="alert" className="border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {errors.form}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] xl:items-start">
        <div className="space-y-6">
          <Panel title="The piece">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Name" required error={errors.name} className="sm:col-span-2">
                {({ id, describedBy, invalid }) => (
                  <Input
                    id={id}
                    value={values.name}
                    onChange={(event) => {
                      const name = event.target.value;
                      setValues((current) => ({
                        ...current,
                        name,
                        // Only auto-fill the slug while it is still untouched,
                        // so an existing URL is never silently changed.
                        slug: productId ? current.slug : slugify(name),
                      }));
                    }}
                    required
                    aria-describedby={describedBy}
                    invalid={invalid}
                  />
                )}
              </Field>

              <Field label="Brand" required error={errors.brand}>
                {({ id, invalid }) => (
                  <Input
                    id={id}
                    value={values.brand}
                    onChange={(event) => set("brand", event.target.value)}
                    required
                    invalid={invalid}
                  />
                )}
              </Field>

              <Field label="Reference / SKU" required error={errors.sku}>
                {({ id, invalid }) => (
                  <Input
                    id={id}
                    value={values.sku}
                    onChange={(event) => set("sku", event.target.value.toUpperCase())}
                    required
                    invalid={invalid}
                    data-numeric
                  />
                )}
              </Field>

              <Field
                label="URL slug"
                required
                hint={`/product/${values.slug || "…"}`}
                error={errors.slug}
              >
                {({ id, invalid }) => (
                  <Input
                    id={id}
                    value={values.slug}
                    onChange={(event) => set("slug", event.target.value)}
                    required
                    invalid={invalid}
                  />
                )}
              </Field>

              <Field label="Category" required error={errors.categoryId}>
                {({ id, invalid }) => (
                  <Select
                    id={id}
                    value={values.categoryId}
                    onChange={(event) => set("categoryId", event.target.value)}
                    required
                    invalid={invalid}
                  >
                    <option value="">Choose a category</option>
                    {options.categories.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <Field
                label="Short description"
                hint="One or two lines, shown under the price"
                error={errors.shortDescription}
                className="sm:col-span-2"
              >
                {({ id, invalid }) => (
                  <Textarea
                    id={id}
                    value={values.shortDescription}
                    onChange={(event) => set("shortDescription", event.target.value)}
                    rows={2}
                    invalid={invalid}
                  />
                )}
              </Field>

              <Field
                label="Description"
                hint="The factual account: what it is, how it wears"
                error={errors.description}
                className="sm:col-span-2"
              >
                {({ id, invalid }) => (
                  <Textarea
                    id={id}
                    value={values.description}
                    onChange={(event) => set("description", event.target.value)}
                    rows={5}
                    invalid={invalid}
                  />
                )}
              </Field>

              <Field
                label="The story"
                hint="Editorial copy shown lower on the page. Markdown-lite is supported."
                error={errors.story}
                className="sm:col-span-2"
              >
                {({ id, invalid }) => (
                  <Textarea
                    id={id}
                    value={values.story}
                    onChange={(event) => set("story", event.target.value)}
                    rows={7}
                    invalid={invalid}
                  />
                )}
              </Field>
            </div>
          </Panel>

          <Panel
            title="Images"
            description="The first image is the primary one. Alt text is required — it is what a screen reader and a search engine read."
          >
            {errors.images ? (
              <p role="alert" className="mb-4 text-xs text-danger">
                {errors.images}
              </p>
            ) : null}

            {values.images.length === 0 ? (
              <p className="mb-4 text-sm text-muted">No images yet.</p>
            ) : (
              <ul className="mb-5 space-y-3">
                {values.images.map((image, index) => (
                  <li key={`${image.url}-${index}`} className="flex gap-4 border border-line p-3">
                    <div className="relative aspect-4/5 w-16 shrink-0 overflow-hidden bg-shell">
                      <Image
                        src={image.url}
                        alt=""
                        fill
                        sizes="64px"
                        quality={75}
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-faint" data-numeric>
                        {image.url}
                        {index === 0 ? " · primary" : ""}
                      </p>
                      <Input
                        value={image.alt}
                        onChange={(event) => {
                          const alt = event.target.value;
                          setValues((current) => ({
                            ...current,
                            images: current.images.map((entry, position) =>
                              position === index ? { ...entry, alt } : entry,
                            ),
                          }));
                        }}
                        placeholder="Describe the image"
                        aria-label={`Alt text for image ${index + 1}`}
                        className="mt-2"
                      />
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <Button
                        variant="outline"
                        size="iconSm"
                        aria-label="Move image up"
                        disabled={index === 0}
                        onClick={() => moveImage(index, -1)}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        variant="outline"
                        size="iconSm"
                        aria-label="Move image down"
                        disabled={index === values.images.length - 1}
                        onClick={() => moveImage(index, 1)}
                      >
                        <ArrowDown />
                      </Button>
                      <Button
                        variant="outline"
                        size="iconSm"
                        aria-label="Remove image"
                        onClick={() =>
                          setValues((current) => ({
                            ...current,
                            images: current.images.filter((_, position) => position !== index),
                          }))
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <MediaPicker
              onSelect={(assets) =>
                setValues((current) => {
                  const existing = new Set(current.images.map((image) => image.url));
                  const additions = assets
                    .filter((asset) => !existing.has(asset.url))
                    .map((asset) => ({ url: asset.url, alt: asset.alt }));
                  return { ...current, images: [...current.images, ...additions].slice(0, 12) };
                })
              }
            />
          </Panel>

          <Panel
            title="Specifications"
            description={
              category
                ? `Fields declared by ${category.name}. Leave anything unknown blank — the product page only shows what is filled in.`
                : "Choose a category to see its specification fields."
            }
          >
            {definitions.length === 0 ? (
              <p className="text-sm text-muted">
                {category
                  ? "This category has no specification fields yet."
                  : "No category selected."}
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {definitions.map((definition) => (
                  <Field
                    key={definition.id}
                    label={definition.unit ? `${definition.label} (${definition.unit})` : definition.label}
                    hint={definition.group ?? undefined}
                  >
                    {({ id }) => (
                      <Input
                        id={id}
                        value={attributeValues.get(definition.id) ?? ""}
                        onChange={(event) => setAttribute(definition.id, event.target.value)}
                        inputMode={definition.type === "NUMBER" ? "decimal" : undefined}
                      />
                    )}
                  </Field>
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="Questions"
            description="Answers specific to this piece. Global FAQs appear on every product page automatically."
          >
            {values.faqs.length > 0 ? (
              <ul className="mb-5 space-y-4">
                {values.faqs.map((faq, index) => (
                  <li key={index} className="border border-line p-4">
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1 space-y-3">
                        <Input
                          value={faq.question}
                          placeholder="Question"
                          aria-label={`Question ${index + 1}`}
                          onChange={(event) => {
                            const question = event.target.value;
                            setValues((current) => ({
                              ...current,
                              faqs: current.faqs.map((entry, position) =>
                                position === index ? { ...entry, question } : entry,
                              ),
                            }));
                          }}
                        />
                        <Textarea
                          value={faq.answer}
                          placeholder="Answer"
                          rows={3}
                          aria-label={`Answer ${index + 1}`}
                          onChange={(event) => {
                            const answer = event.target.value;
                            setValues((current) => ({
                              ...current,
                              faqs: current.faqs.map((entry, position) =>
                                position === index ? { ...entry, answer } : entry,
                              ),
                            }));
                          }}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="iconSm"
                        aria-label="Remove question"
                        onClick={() =>
                          setValues((current) => ({
                            ...current,
                            faqs: current.faqs.filter((_, position) => position !== index),
                          }))
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setValues((current) => ({
                  ...current,
                  faqs: [...current.faqs, { question: "", answer: "" }],
                }))
              }
            >
              <Plus />
              Add question
            </Button>
          </Panel>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 xl:sticky xl:top-8">
          <Panel title="Availability">
            <div className="space-y-5">
              <Field label="Status" required error={errors.status}>
                {({ id }) => (
                  <Select
                    id={id}
                    value={values.status}
                    onChange={(event) =>
                      set("status", event.target.value as ProductFormValues["status"])
                    }
                  >
                    {PRODUCT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.charAt(0) + status.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Stock" error={errors.stock}>
                  {({ id, invalid }) => (
                    <Input
                      id={id}
                      type="number"
                      min={0}
                      value={values.stock}
                      onChange={(event) => set("stock", event.target.value)}
                      invalid={invalid}
                      data-numeric
                    />
                  )}
                </Field>
                <Field label="Low at" hint="Warn below this" error={errors.lowStockThreshold}>
                  {({ id, invalid }) => (
                    <Input
                      id={id}
                      type="number"
                      min={0}
                      value={values.lowStockThreshold}
                      onChange={(event) => set("lowStockThreshold", event.target.value)}
                      invalid={invalid}
                      data-numeric
                    />
                  )}
                </Field>
              </div>

              <Checkbox
                checked={values.allowBackorder}
                onCheckedChange={(state) => set("allowBackorder", state === true)}
                label="Accept orders when out of stock"
              />
              <Checkbox
                checked={values.comingSoon}
                onCheckedChange={(state) => set("comingSoon", state === true)}
                label="Coming soon (no stock shown, cannot be bought)"
              />
            </div>
          </Panel>

          <Panel title="Price">
            <div className="space-y-5">
              <Field label="Price" required hint="Major units, e.g. 42500" error={errors.price}>
                {({ id, invalid }) => (
                  <Input
                    id={id}
                    type="number"
                    min={0}
                    step="0.01"
                    value={values.price}
                    onChange={(event) => set("price", event.target.value)}
                    required
                    invalid={invalid}
                    data-numeric
                  />
                )}
              </Field>
              <Field
                label="Compare at"
                hint="Optional, shows a struck-through price"
                error={errors.compareAtPrice}
              >
                {({ id, invalid }) => (
                  <Input
                    id={id}
                    type="number"
                    min={0}
                    step="0.01"
                    value={values.compareAtPrice}
                    onChange={(event) => set("compareAtPrice", event.target.value)}
                    invalid={invalid}
                    data-numeric
                  />
                )}
              </Field>
              <Field label="Currency" error={errors.currency}>
                {({ id }) => (
                  <Select
                    id={id}
                    value={values.currency}
                    onChange={(event) => set("currency", event.target.value)}
                  >
                    <option value="PKR">PKR</option>
                    <option value="USD">USD</option>
                    <option value="AED">AED</option>
                  </Select>
                )}
              </Field>
            </div>
          </Panel>

          <Panel title="Placement" description="Badges are deliberately restrained — use them sparingly.">
            <div className="space-y-3.5">
              <Checkbox
                checked={values.featured}
                onCheckedChange={(state) => set("featured", state === true)}
                label="Featured on the homepage"
              />
              <Checkbox
                checked={values.newArrival}
                onCheckedChange={(state) => set("newArrival", state === true)}
                label="New arrival"
              />
              <Checkbox
                checked={values.bestseller}
                onCheckedChange={(state) => set("bestseller", state === true)}
                label="Best seller"
              />
              <Checkbox
                checked={values.limited}
                onCheckedChange={(state) => set("limited", state === true)}
                label="Limited"
              />
              <Checkbox
                checked={values.exclusive}
                onCheckedChange={(state) => set("exclusive", state === true)}
                label="Exclusive"
              />
            </div>
          </Panel>

          {options.collections.length > 0 ? (
            <Panel title="Collections">
              <div className="space-y-3">
                {options.collections.map((collection) => (
                  <Checkbox
                    key={collection.id}
                    checked={values.collectionIds.includes(collection.id)}
                    onCheckedChange={(state) =>
                      set(
                        "collectionIds",
                        state === true
                          ? [...values.collectionIds, collection.id]
                          : values.collectionIds.filter((id) => id !== collection.id),
                      )
                    }
                    label={collection.name}
                  />
                ))}
              </div>
            </Panel>
          ) : null}

          {Object.keys(tagsByKind).length > 0 ? (
            <Panel title="Discovery tags" description="Feeds the gift guide and the finder.">
              <div className="space-y-5">
                {Object.entries(tagsByKind).map(([kind, tags]) => (
                  <div key={kind}>
                    <p className="eyebrow mb-2.5 text-[0.5rem] text-faint">{kind}</p>
                    <div className="space-y-2.5">
                      {tags.map((tag) => (
                        <Checkbox
                          key={tag.id}
                          checked={values.tagIds.includes(tag.id)}
                          onCheckedChange={(state) =>
                            set(
                              "tagIds",
                              state === true
                                ? [...values.tagIds, tag.id]
                                : values.tagIds.filter((id) => id !== tag.id),
                            )
                          }
                          label={tag.label}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}

          <Panel title="Search appearance" description="Sensible defaults are generated when blank.">
            <div className="space-y-5">
              <Field
                label="SEO title"
                hint={`${values.seoTitle.length}/70`}
                error={errors.seoTitle}
              >
                {({ id, invalid }) => (
                  <Input
                    id={id}
                    value={values.seoTitle}
                    onChange={(event) => set("seoTitle", event.target.value)}
                    invalid={invalid}
                  />
                )}
              </Field>
              <Field
                label="Meta description"
                hint={`${values.seoDescription.length}/180`}
                error={errors.seoDescription}
              >
                {({ id, invalid }) => (
                  <Textarea
                    id={id}
                    rows={3}
                    value={values.seoDescription}
                    onChange={(event) => set("seoDescription", event.target.value)}
                    invalid={invalid}
                  />
                )}
              </Field>
              <Field label="Canonical URL" hint="Only if this page duplicates another" error={errors.canonicalUrl}>
                {({ id, invalid }) => (
                  <Input
                    id={id}
                    value={values.canonicalUrl}
                    onChange={(event) => set("canonicalUrl", event.target.value)}
                    invalid={invalid}
                  />
                )}
              </Field>
              <Field label="Social image URL" error={errors.ogImageUrl}>
                {({ id, invalid }) => (
                  <Input
                    id={id}
                    value={values.ogImageUrl}
                    onChange={(event) => set("ogImageUrl", event.target.value)}
                    invalid={invalid}
                  />
                )}
              </Field>
              <Checkbox
                checked={values.noIndex}
                onCheckedChange={(state) => set("noIndex", state === true)}
                label="Ask search engines not to index this page"
              />
            </div>
          </Panel>
        </div>
      </div>

      {/* Save bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-canvas/95 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:pl-[17rem] lg:pr-10">
          <p className="truncate text-xs text-muted">
            {productId ? "Editing" : "New product"} · {values.name || "Untitled"}
          </p>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.push("/admin/products")}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? <Spinner className="size-4" /> : null}
              {productId ? "Save changes" : "Create product"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
