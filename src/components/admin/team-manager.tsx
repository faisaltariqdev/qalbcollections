"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { KeyRound, Plus } from "lucide-react";
import { toast } from "sonner";

import { Panel, StatusPill, TableWrap, Td, Th } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/primitives";
import { ADMIN_ROLES, type AdminRole } from "@/lib/constants";
import { ROLE_PERMISSIONS } from "@/lib/auth/permissions";
import {
  createAdminUser,
  resetAdminPassword,
  updateAdminUser,
} from "@/server/actions/admin-team-actions";

export interface TeamRow {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  lastLoginAt: string | null;
  isSelf: boolean;
}

const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin",
  EDITOR: "Editor",
  ORDER_MANAGER: "Order manager",
};

export function TeamManager({ members }: { members: TeamRow[] }) {
  const [inviting, setInviting] = useState(false);
  const [resetting, setResetting] = useState<TeamRow | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function change(id: string, patch: { role?: AdminRole; active?: boolean }) {
    startTransition(async () => {
      const result = await updateAdminUser({ id, ...patch });
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      router.refresh();
    });
  }

  return (
    <>
      <Panel
        title="Accounts"
        description="Each role can reach only what it needs. Every page and action checks the same list again on the server."
        actions={
          <Button size="sm" variant="secondary" onClick={() => setInviting(true)}>
            <Plus className="size-4" />
            Add account
          </Button>
        }
      >
        <TableWrap>
          <thead>
            <tr>
              <Th>Person</Th>
              <Th>Role</Th>
              <Th>Last signed in</Th>
              <Th>State</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <Td>
                  <span className="block text-sm text-ink">
                    {member.name}
                    {member.isSelf ? " (you)" : ""}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-faint">{member.email}</span>
                </Td>
                <Td>
                  <Select
                    className="min-w-40 px-2.5 py-1.5 text-xs"
                    value={member.role}
                    disabled={pending || member.isSelf}
                    aria-label={`Role for ${member.name}`}
                    onChange={(event) =>
                      change(member.id, { role: event.target.value as AdminRole })
                    }
                  >
                    {ADMIN_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </Select>
                </Td>
                <Td className="whitespace-nowrap text-xs">{member.lastLoginAt ?? "Never"}</Td>
                <Td>
                  <div className="flex items-center gap-3">
                    <StatusPill tone={member.active ? "positive" : "danger"}>
                      {member.active ? "Active" : "Off"}
                    </StatusPill>
                    {member.isSelf ? null : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-0 text-[0.5625rem]"
                        disabled={pending}
                        onClick={() => change(member.id, { active: !member.active })}
                      >
                        {member.active ? "Deactivate" : "Reactivate"}
                      </Button>
                    )}
                  </div>
                </Td>
                <Td>
                  <button
                    type="button"
                    aria-label={`Reset password for ${member.name}`}
                    onClick={() => setResetting(member)}
                    className="text-muted transition-colors hover:text-ink"
                  >
                    <KeyRound className="size-4" />
                  </button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>

        <div className="mt-8 border-t border-line pt-6">
          <h3 className="eyebrow text-[0.5rem] text-faint">What each role can do</h3>
          <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {ADMIN_ROLES.map((role) => (
              <div key={role}>
                <dt className="text-sm text-ink">{ROLE_LABELS[role]}</dt>
                <dd className="mt-1 text-xs leading-relaxed text-muted">
                  {role === "SUPER_ADMIN"
                    ? "Everything, including team access."
                    : ROLE_PERMISSIONS[role].join(", ")}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Panel>

      <InviteDialog open={inviting} onClose={() => setInviting(false)} />
      <ResetDialog member={resetting} onClose={() => setResetting(null)} />
    </>
  );
}

function InviteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [values, setValues] = useState({
    name: "",
    email: "",
    role: "EDITOR" as AdminRole,
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    startTransition(async () => {
      const result = await createAdminUser(values);
      setErrors(result.fieldErrors ?? {});
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setValues({ name: "", email: "", role: "EDITOR", password: "" });
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent className="max-w-md">
        <div className="p-7">
          <DialogTitle className="font-display text-xl font-light text-ink">
            Add an account
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-muted">
            Set a temporary password and pass it on privately. They can change it after signing in.
          </DialogDescription>

          <div className="mt-6 space-y-5">
            <Field label="Name" required error={errors.name}>
              {({ id, invalid }) => (
                <Input
                  id={id}
                  invalid={invalid}
                  value={values.name}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, name: event.target.value }))
                  }
                />
              )}
            </Field>
            <Field label="Email" required error={errors.email}>
              {({ id, invalid }) => (
                <Input
                  id={id}
                  invalid={invalid}
                  type="email"
                  autoComplete="off"
                  value={values.email}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, email: event.target.value }))
                  }
                />
              )}
            </Field>
            <Field label="Role">
              {({ id }) => (
                <Select
                  id={id}
                  value={values.role}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, role: event.target.value as AdminRole }))
                  }
                >
                  {ADMIN_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field
              label="Temporary password"
              required
              hint="At least 10 characters, with upper and lower case and a number"
              error={errors.password}
            >
              {({ id, invalid }) => (
                <Input
                  id={id}
                  invalid={invalid}
                  type="text"
                  autoComplete="new-password"
                  value={values.password}
                  onChange={(event) =>
                    setValues((current) => ({ ...current, password: event.target.value }))
                  }
                />
              )}
            </Field>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={pending}>
              {pending ? <Spinner className="size-4" /> : null}
              Create account
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ResetDialog({ member, onClose }: { member: TeamRow | null; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (!member) return;
    startTransition(async () => {
      const result = await resetAdminPassword({ id: member.id, password });
      setError(result.fieldErrors?.password);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setPassword("");
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open={member !== null} onOpenChange={(next) => (next ? null : onClose())}>
      <DialogContent className="max-w-md">
        <div className="p-7">
          <DialogTitle className="font-display text-xl font-light text-ink">
            Reset password
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-muted">
            {member ? `${member.name} will be signed out everywhere.` : ""}
          </DialogDescription>

          <div className="mt-6">
            <Field label="New password" required error={error}>
              {({ id, invalid }) => (
                <Input
                  id={id}
                  invalid={invalid}
                  type="text"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              )}
            </Field>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={pending || password.length < 10}>
              {pending ? <Spinner className="size-4" /> : null}
              Reset
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
