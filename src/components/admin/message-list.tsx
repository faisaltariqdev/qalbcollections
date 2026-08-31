"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Panel, StatusPill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { setMessageStatus } from "@/server/actions/admin-message-actions";

export interface MessageRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

const NEXT_STATE: Record<string, { label: string; status: "READ" | "ANSWERED" | "ARCHIVED" }[]> = {
  NEW: [
    { label: "Mark read", status: "READ" },
    { label: "Mark answered", status: "ANSWERED" },
  ],
  READ: [
    { label: "Mark answered", status: "ANSWERED" },
    { label: "Archive", status: "ARCHIVED" },
  ],
  ANSWERED: [{ label: "Archive", status: "ARCHIVED" }],
  ARCHIVED: [],
};

const TONES = {
  NEW: "warning",
  READ: "accent",
  ANSWERED: "positive",
  ARCHIVED: "neutral",
} as const;

export function MessageList({ messages }: { messages: MessageRow[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function move(id: string, status: "READ" | "ANSWERED" | "ARCHIVED") {
    startTransition(async () => {
      const result = await setMessageStatus({ id, status });
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <Panel
          key={message.id}
          title={message.subject}
          description={`${message.name} · ${message.createdAt}`}
          actions={
            <StatusPill tone={TONES[message.status as keyof typeof TONES] ?? "neutral"}>
              {message.status.toLowerCase()}
            </StatusPill>
          }
        >
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">
            {message.message}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-line pt-5">
            <a
              href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
              className="text-sm text-ink hover:underline"
            >
              {message.email}
            </a>
            {message.phone ? (
              <a
                href={`tel:${message.phone}`}
                className="text-sm text-muted hover:text-ink"
                data-numeric
              >
                {message.phone}
              </a>
            ) : null}

            <div className="ml-auto flex items-center gap-2">
              {(NEXT_STATE[message.status] ?? []).map((option) => (
                <Button
                  key={option.status}
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => move(message.id, option.status)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </Panel>
      ))}
    </div>
  );
}
