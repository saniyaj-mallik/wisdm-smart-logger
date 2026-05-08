import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import TimeEntry from "@/models/TimeEntry";
import "@/models/Project";
import "@/models/Task";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardClient } from "./DashboardClient";
import { getWeekRange } from "@/lib/time-utils";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  await connectDB();

  const { from, to } = getWeekRange();

  const [weekEntries, recentEntries] = await Promise.all([
    TimeEntry.find({ userId, loggedAt: { $gte: from, $lte: to } })
      .populate("projectId", "name")
      .populate("taskId", "name")
      .lean(),
    TimeEntry.find({ userId })
      .sort({ loggedAt: -1, createdAt: -1 })
      .limit(10)
      .populate("projectId", "name")
      .populate("taskId", "name")
      .lean(),
  ]);

  const totalHours = weekEntries.reduce((s, e) => s + (e.hours ?? 0), 0);
  const billableHrs = weekEntries.filter((e) => e.isBillable).reduce((s, e) => s + (e.hours ?? 0), 0);
  const nonBillable = totalHours - billableHrs;
  const aiCount = weekEntries.filter((e) => e.aiUsed).length;

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
