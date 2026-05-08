import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import TimeEntry from "@/models/TimeEntry";
import "@/models/Project";
import "@/models/Task";
import { LogsClient } from "./LogsClient";

export default async function LogsPage() {
  const session = await auth();
  const userId = session!.user.id;

  await connectDB();

  const entries = await TimeEntry.find({})
    .sort({ loggedAt: -1, createdAt: -1 })
    .limit(200)
    .populate("projectId", "name color")
    .populate("taskId", "name")
    .populate("userId", "name email")
    .lean();

  return (
    <LogsClient
      entries={JSON.parse(JSON.stringify(entries))}
      currentUserId={userId}
      isManagerOrAdmin={true}
    />
  );
}
