import { TeamManager } from "@/components/admin/team-manager";
import { PageHeader } from "@/components/admin/ui";
import { requireAdminPage } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export default async function AdminTeamPage() {
  const admin = await requireAdminPage("admin.manage");

  const members = await db.adminUser.findMany({
    orderBy: [{ active: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      lastLoginAt: true,
    },
  });

  return (
    <>
      <PageHeader
        title="Team"
        description="Who can reach the dashboard, and how much of it. Deactivating an account signs it out immediately."
      />
      <TeamManager
        members={members.map((member) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          active: member.active,
          lastLoginAt: member.lastLoginAt ? formatDateTime(member.lastLoginAt) : null,
          isSelf: member.id === admin.id,
        }))}
      />
    </>
  );
}
