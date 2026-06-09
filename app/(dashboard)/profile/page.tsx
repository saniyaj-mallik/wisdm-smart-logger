import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccountCard, SecurityCard, GoogleCalendarCard } from "./ProfileForm";
import { McpIntegrationCard } from "@/components/McpIntegrationCard";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

async function getCalendarConnected(userId: string): Promise<boolean> {
  try {
    await connectDB();
    const user = await User.findById(userId).select("googleRefreshToken").lean() as { googleRefreshToken?: string | null } | null;
    return !!user?.googleRefreshToken;
  } catch {
    return false;
  }
}

export default async function ProfilePage() {
  const session   = await auth();
  const connected = session ? await getCalendarConnected(session.user.id) : false;

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Profile"
        description="Manage your account, security, and AI integrations"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccountCard />
        <SecurityCard />
      </div>
      <Suspense>
        <GoogleCalendarCard initialConnected={connected} />
      </Suspense>
      <McpIntegrationCard />
    </div>
  );
}
