import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import TimeEntry from "@/models/TimeEntry";
import "@/models/Project";
import "@/models/Task";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  await connectDB();

  const recentEntries = await TimeEntry.find({ userId })
    .sort({ loggedAt: -1, createdAt: -1 })
    .limit(10)
    .populate("projectId", "name")
    .populate("taskId", "name")
    .lean();

  const totalHours = recentEntries.reduce((s, e) => s + (e.hours ?? 0), 0);
  const billableHrs = recentEntries.filter((e) => e.isBillable).reduce((s, e) => s + (e.hours ?? 0), 0);
  const nonBillable = totalHours - billableHrs;
  const aiCount = recentEntries.filter((e) => e.aiUsed).length;

  const stats = {
    totalHours: Math.round(totalHours * 100) / 100,
    billableHrs: Math.round(billableHrs * 100) / 100,
    nonBillable: Math.round(nonBillable * 100) / 100,
    aiCount,
  };

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${session?.user?.name}`}
      />
      <DashboardClient
        stats={stats}
        recentEntries={JSON.parse(JSON.stringify(recentEntries))}
      />
    </div>
  );
}
