import { PageHeader } from "@/components/layout/PageHeader";
import { ProfileForm } from "./ProfileForm";

export default function ProfilePage() {
  return (
    <div>
      <PageHeader title="Profile" description="Update your account details" />
      <div className="max-w-md">
        <ProfileForm />
      </div>
    </div>
  );
}
