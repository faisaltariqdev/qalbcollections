import Link from "next/link";

import { MessageList } from "@/components/admin/message-list";
import { AdminEmpty, PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { cn, formatDateTime } from "@/lib/utils";

const FILTERS = [
  { value: "open", label: "Needs a reply" },
  { value: "all", label: "Everything" },
  { value: "ANSWERED", label: "Answered" },
  { value: "ARCHIVED", label: "Archived" },
] as const;

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requireAdminPage("customer.read");
  const { view = "open" } = await searchParams;

  const where =
    view === "all"
      ? {}
      : view === "ANSWERED" || view === "ARCHIVED"
        ? { status: view }
        : { status: { in: ["NEW", "READ"] } };

  const [messages, waiting] = await Promise.all([
    db.contactMessage.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }),
    db.contactMessage.count({ where: { status: { in: ["NEW", "READ"] } } }),
  ]);

  return (
    <>
      <PageHeader
        title="Enquiries"
        description={
          waiting > 0
            ? `${waiting} enquiry${waiting === 1 ? "" : "-ies"} still waiting on a reply.`
            : "Everything has been answered."
        }
      />

      <nav aria-label="Filter enquiries" className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={`/admin/messages?view=${filter.value}`}
            className={cn(
              "eyebrow border px-3 py-1.5 text-[0.5rem] transition-colors",
              view === filter.value
                ? "border-ink bg-ink text-canvas"
                : "border-line text-muted hover:border-ink hover:text-ink",
            )}
          >
            {filter.label}
          </Link>
        ))}
      </nav>

      {messages.length === 0 ? (
        <AdminEmpty
          title="Nothing here"
          description="Enquiries from the contact form land on this page."
        />
      ) : (
        <MessageList
          messages={messages.map((message) => ({
            id: message.id,
            name: message.name,
            email: message.email,
            phone: message.phone,
            subject: message.subject,
            message: message.message,
            status: message.status,
            createdAt: formatDateTime(message.createdAt),
          }))}
        />
      )}
    </>
  );
}
