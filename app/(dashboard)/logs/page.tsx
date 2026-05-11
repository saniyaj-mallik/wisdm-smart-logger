import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import TimeEntry from "@/models/TimeEntry";
import User from "@/models/User";
import "@/models/Project";
import "@/models/Task";
import { LogsClient } from "./LogsClient";

export default async function LogsPage({
  searchParams,
}: {
  searchParams: { userId?: string };
}) {
  const session = await auth();
  const currentUserId = session!.user.id;
  const isManagerOrAdmin =
    session?.user?.role === "manager" || session?.user?.role === "admin";

  // Anyone can view any user's logs; only own logs are editable
  const viewingUserId = searchParams?.userId ?? currentUserId;

  await connectDB();

  const [entries, users] = await Promise.all([
    TimeEntry.find({ userId: viewingUserId })
      .sort({ loggedAt: -1, createdAt: -1 })
      .limit(200)
      .populate("projectId", "name color")
      .populate("taskId", "name")
      .populate("userId", "name email")
      .lean(),
    User.find({ isActive: true }, "name email role").sort({ name: 1 }).lean(),
  ]);

  return (
    <LogsClient
      entries={JSON.parse(JSON.stringify(entries))}
      currentUserId={currentUserId}
      viewingUserId={viewingUserId}
      isManagerOrAdmin={isManagerOrAdmin}
      users={JSON.parse(JSON.stringify(users))}
    />
  );
}
