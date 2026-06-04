import { PageHeader } from "@/components/layout/PageHeader";
import { ProfileForm } from "./ProfileForm";
import { McpIntegrationCard } from "@/components/McpIntegrationCard";

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Update your account details" />
      <div className="max-w-md">
        <ProfileForm />
      </div>
      <div className="max-w-xl">
        <McpIntegrationCard />
      </div>
    </div>
  );
}
