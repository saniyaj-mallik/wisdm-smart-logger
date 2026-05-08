import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { PageHeader } from "@/components/layout/PageHeader";
import { UsersTable } from "./UsersTable";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session) redirect("/login");

  await connectDB();
  const users = await User.find({})
    .select("-passwordHash")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage team members and their roles"
      />
      <UsersTable users={JSON.parse(JSON.stringify(users))} />
    </div>
  );
}
