import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { TeamManagementSection } from "@/components/teams/TeamManagementSection";

export default async function TeamReportPage() {
  const session = await auth();
  if (!session) return null;

  return (
    <div>
      <PageHeader title="Team Overview" description="Manage teams and collaborate with your colleagues" />
      <TeamManagementSection currentUserId={session.user.id} />
    </div>
  );
}
