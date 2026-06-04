import { PageHeader } from "@/components/layout/PageHeader";
import { AccountCard, SecurityCard } from "./ProfileForm";
import { McpIntegrationCard } from "@/components/McpIntegrationCard";

export default function ProfilePage() {
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
      <McpIntegrationCard />
    </div>
  );
}
