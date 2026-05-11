import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import TimeEntry from "@/models/TimeEntry";
import { PageHeader } from "@/components/layout/PageHeader";
import { TeamOverviewTable } from "@/components/reports/TeamOverviewTable";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { TeamManagementSection } from "@/components/teams/TeamManagementSection";
import { getWeekRange } from "@/lib/time-utils";

export default async function TeamReportPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const session = await auth();
  if (!session) return null;

  const defaultRange = getWeekRange();
  const from = searchParams.from ?? defaultRange.from.toISOString().slice(0, 10);
  const to = searchParams.to ?? defaultRange.to.toISOString().slice(0, 10);

  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  await connectDB();

  const rows = await TimeEntry.aggregate([
    {
      $match: { loggedAt: { $gte: new Date(from), $lte: toDate } },
    },
    {
      $group: {
        _id: "$userId",
        totalHours:    { $sum: "$hours" },
        billableHours: { $sum: { $cond: ["$isBillable", "$hours", 0] } },
        aiHours:       { $sum: { $cond: ["$aiUsed", "$hours", 0] } },
        entryCount:    { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        totalHours: 1, billableHours: 1, aiHours: 1, entryCount: 1,
        "user.name": 1, "user.email": 1, "user.role": 1,
      },
    },
    { $sort: { totalHours: -1 } },
  ]);

  const data = rows.map((r: { _id: unknown; user: { name: string; email: string; role: string }; totalHours: number; billableHours: number; aiHours: number; entryCount: number }) => ({
    userId: String(r._id),
    userName: r.user.name,
    userEmail: r.user.email,
    userRole: r.user.role,
    totalHours: Math.round((r.totalHours ?? 0) * 100) / 100,
    billableHours: Math.round((r.billableHours ?? 0) * 100) / 100,
    aiHours: Math.round((r.aiHours ?? 0) * 100) / 100,
    entryCount: r.entryCount,
  }));

  return (
    <div>
      <PageHeader title="Team Overview" description="Hours breakdown and team collaboration" />
      <ReportFilters defaultFrom={from} defaultTo={to} />
      <TeamOverviewTable rows={data} />
      <TeamManagementSection currentUserId={session.user.id} />
    </div>
  );
}
