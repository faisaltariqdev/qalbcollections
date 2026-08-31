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
import {
  deleteAnnouncement,
  deleteNavItem,
  saveAnnouncement,
  saveNavItem,
} from "@/server/actions/admin-content-actions";

export interface NavRow {
  id: string;
  label: string;
  href: string;
  location: string;
  groupName: string | null;
  badge: string | null;
  parentId: string | null;
  sortOrder: number;
  active: boolean;
}

export interface AnnouncementRow {
  id: string;
  message: string;
  href: string | null;
  active: boolean;
  sortOrder: number;
}

interface NavDraft {
  id?: string;
  label: string;
  href: string;
  location: "header" | "footer";
  groupName: string;
  badge: string;
  parentId: string;
  sortOrder: string;
  active: boolean;
}

function blankNav(location: "header" | "footer"): NavDraft {
  return {
    label: "",
    href: "",
    location,
    groupName: "",
    badge: "",
    parentId: "",
    sortOrder: "0",
    active: true,
  };
}

/**
 * Header and footer links.
 *
 * Top-level header links with children render as a mega-menu column; footer
 * links are grouped by their group name. Both trees are data, so a new
 * category needs a link here rather than a code change.
 */
export function NavigationEditor({
  items,
  announcements,
}: {
  items: NavRow[];
  announcements: AnnouncementRow[];
}) {
  const [draft, setDraft] = useState<NavDraft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const parents = items.filter((item) => item.location === "header" && !item.parentId);
  const byLocation = {
    header: items.filter((item) => item.location === "header"),
    footer: items.filter((item) => item.location === "footer"),
  };

  function set<K extends keyof NavDraft>(key: K, value: NavDraft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function submit() {
    if (!draft) return;
    startTransition(async () => {
      const result = await saveNavItem(draft);
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
      const result = await deleteNavItem(id);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {(["header", "footer"] as const).map((location) => (
        <Panel
          key={location}
          title={location === "header" ? "Header navigation" : "Footer navigation"}
          description={
            location === "header"
              ? "Top-level links appear in the bar. Give a link a parent to make it a mega-menu entry."
              : "Grouped into columns by group name."
          }
          actions={
            <Button size="sm" variant="secondary" onClick={() => setDraft(blankNav(location))}>
              <Plus className="size-4" />
              Add link
            </Button>
          }
        >
          {byLocation[location].length === 0 ? (
            <p className="text-sm text-muted">No links yet.</p>
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Label</Th>
                  <Th>Target</Th>
                  <Th>{location === "header" ? "Under" : "Column"}</Th>
                  <Th className="text-right">Order</Th>
                  <Th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {byLocation[location].map((item) => {
                  const parent = items.find((candidate) => candidate.id === item.parentId);
                  return (
                    <tr key={item.id}>
                      <Td>
                        <button
                          type="button"
                          className="text-left text-ink hover:underline"
                          onClick={() =>
                            setDraft({
                              id: item.id,
                              label: item.label,
                              href: item.href,
                              location: item.location === "footer" ? "footer" : "header",
                              groupName: item.groupName ?? "",
                              badge: item.badge ?? "",
                              parentId: item.parentId ?? "",
                              sortOrder: String(item.sortOrder),
                              active: item.active,
                            })
                          }
                        >
                          {item.label}
                        </button>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {item.badge ? <StatusPill tone="accent">{item.badge}</StatusPill> : null}
                          {!item.active ? <StatusPill tone="warning">Hidden</StatusPill> : null}
                        </div>
                      </Td>
                      <Td className="text-xs text-muted">{item.href}</Td>
                      <Td className="text-xs text-muted">
                        {location === "header" ? (parent?.label ?? "Top level") : (item.groupName ?? "—")}
                      </Td>
                      <Td className="text-right" data-numeric>
                        {item.sortOrder}
                      </Td>
                      <Td>
                        <button
                          type="button"
                          aria-label={`Remove ${item.label}`}
                          disabled={pending}
                          onClick={() => remove(item.id)}
                          className="text-muted transition-colors hover:text-danger disabled:opacity-50"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          )}
        </Panel>
      ))}

      <AnnouncementsPanel announcements={announcements} />

      <Dialog open={draft !== null} onOpenChange={(open) => (open ? null : setDraft(null))}>
        <DialogContent className="max-w-lg">
          {draft ? (
            <div className="p-7">
              <DialogTitle className="font-display text-xl font-light text-ink">
                {draft.id ? "Edit link" : "Add link"}
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm text-muted">
                Links can point anywhere on the site, e.g. /watches or /collection/signature.
              </DialogDescription>

              <div className="mt-6 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Label" required error={errors.label}>
                    {({ id, invalid }) => (
                      <Input
                        id={id}
                        invalid={invalid}
                        value={draft.label}
                        onChange={(event) => set("label", event.target.value)}
                      />
                    )}
                  </Field>
                  <Field label="Target" required error={errors.href}>
                    {({ id, invalid }) => (
                      <Input
                        id={id}
                        invalid={invalid}
                        value={draft.href}
                        onChange={(event) => set("href", event.target.value)}
                        placeholder="/watches"
                      />
                    )}
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Location">
                    {({ id }) => (
                      <Select
                        id={id}
                        value={draft.location}
                        onChange={(event) =>
                          set("location", event.target.value as "header" | "footer")
                        }
                      >
                        <option value="header">Header</option>
                        <option value="footer">Footer</option>
                      </Select>
                    )}
                  </Field>
                  <Field label="Badge" hint="e.g. Coming soon">
                    {({ id }) => (
                      <Input
                        id={id}
                        value={draft.badge}
                        onChange={(event) => set("badge", event.target.value)}
                      />
                    )}
                  </Field>
                </div>

                {draft.location === "header" ? (
                  <Field label="Sits under" hint="Leave as top level for a link in the bar itself">
                    {({ id }) => (
                      <Select
                        id={id}
                        value={draft.parentId}
                        onChange={(event) => set("parentId", event.target.value)}
                      >
                        <option value="">Top level</option>
                        {parents
                          .filter((parent) => parent.id !== draft.id)
                          .map((parent) => (
                            <option key={parent.id} value={parent.id}>
                              {parent.label}
                            </option>
                          ))}
                      </Select>
                    )}
                  </Field>
                ) : (
                  <Field label="Column" hint="Footer links with the same column sit together">
                    {({ id }) => (
                      <Input
                        id={id}
                        value={draft.groupName}
                        onChange={(event) => set("groupName", event.target.value)}
                        placeholder="Customer care"
                      />
                    )}
                  </Field>
                )}

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

                <Checkbox
                  checked={draft.active}
                  onCheckedChange={(checked) => set("active", checked === true)}
                  label="Show this link"
                />
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
    </div>
  );
}

function AnnouncementsPanel({ announcements }: { announcements: AnnouncementRow[] }) {
  const [message, setMessage] = useState("");
  const [href, setHref] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function add() {
    startTransition(async () => {
      const result = await saveAnnouncement({
        message,
        href,
        active: true,
        sortOrder: announcements.length,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setMessage("");
      setHref("");
      router.refresh();
    });
  }

  function toggle(row: AnnouncementRow) {
    startTransition(async () => {
      const result = await saveAnnouncement({ ...row, href: row.href ?? "", active: !row.active });
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteAnnouncement(id);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      router.refresh();
    });
  }

  return (
    <Panel
      title="Announcement bar"
      description="The thin line above the header. Use it sparingly — one message people read beats three they ignore."
    >
      {announcements.length > 0 ? (
        <ul className="mb-6 space-y-3">
          {announcements.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 border border-line px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-ink-soft">{row.message}</p>
                {row.href ? <p className="text-xs text-faint">{row.href}</p> : null}
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" disabled={pending} onClick={() => toggle(row)}>
                  {row.active ? "Hide" : "Show"}
                </Button>
                <button
                  type="button"
                  aria-label="Remove announcement"
                  disabled={pending}
                  onClick={() => remove(row.id)}
                  className="text-muted transition-colors hover:text-danger disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="grid items-end gap-4 sm:grid-cols-[2fr_1fr_auto]">
        <Field label="Message">
          {({ id }) => (
            <Input
              id={id}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Complimentary delivery across Pakistan"
            />
          )}
        </Field>
        <Field label="Link" hint="Optional">
          {({ id }) => (
            <Input id={id} value={href} onChange={(event) => setHref(event.target.value)} />
          )}
        </Field>
        <Button size="sm" variant="secondary" onClick={add} disabled={pending || message.length < 4}>
          {pending ? <Spinner className="size-4" /> : <Plus className="size-4" />}
          Add
        </Button>
      </div>
    </Panel>
  );
}
