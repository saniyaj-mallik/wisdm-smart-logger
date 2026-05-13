import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import TimeEntry from "@/models/TimeEntry";
import User from "@/models/User";
import { Types } from "mongoose";
import { PageHeader } from "@/components/layout/PageHeader";
import { SummaryCards } from "@/components/reports/SummaryCards";
import { ProjectBreakdownTable } from "@/components/reports/ProjectBreakdownTable";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { SummaryCharts } from "@/components/reports/SummaryCharts";
import { getWeekRange } from "@/lib/time-utils";

function fillDailyData(
  aggregated: { date: string; totalHours: number; billableHours: number }[],
  from: string,
  to: string
) {
  const map = new Map(aggregated.map((d) => [d.date, d]));
  const result: { date: string; billableHours: number; nonBillableHours: number }[] = [];
  const current = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");
  while (current <= end) {
    const key = current.toISOString().slice(0, 10);
    const entry = map.get(key);
    const total = Math.round((entry?.totalHours ?? 0) * 100) / 100;
    const billable = Math.round((entry?.billableHours ?? 0) * 100) / 100;
    result.push({
      date: key,
      billableHours: billable,
      nonBillableHours: Math.round((total - billable) * 100) / 100,
    });
    current.setDate(current.getDate() + 1);
  }
  return result;
}

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; userId?: string };
}) {
  const session = await auth();
  const currentUserId = session!.user.id;
  const targetUserId = searchParams.userId ?? currentUserId;

  const defaultRange = getWeekRange();
  const from = searchParams.from ?? defaultRange.from.toISOString().slice(0, 10);
  const to = searchParams.to ?? defaultRange.to.toISOString().slice(0, 10);

  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  await connectDB();

  const [summaryResult, projectRows, dailyRows, allUsers] = await Promise.all([
    TimeEntry.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(targetUserId),
          loggedAt: { $gte: new Date(from), $lte: toDate },
        },
      },
      {
        $group: {
          _id: null,
          totalHours:    { $sum: "$hours" },
          billableHours: { $sum: { $cond: ["$isBillable", "$hours", 0] } },
          aiHours:       { $sum: { $cond: ["$aiUsed", "$hours", 0] } },
          entryCount:    { $sum: 1 },
        },
      },
    ]),
    TimeEntry.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(targetUserId),
          loggedAt: { $gte: new Date(from), $lte: toDate },
        },
      },
      {
        $group: {
          _id: "$projectId",
          totalHours:    { $sum: "$hours" },
          billableHours: { $sum: { $cond: ["$isBillable", "$hours", 0] } },
          entryCount:    { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "projects",
          localField: "_id",
          foreignField: "_id",
          as: "project",
        },
      },
      { $unwind: "$project" },
      { $sort: { totalHours: -1 } },
    ]),
    TimeEntry.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(targetUserId),
          loggedAt: { $gte: new Date(from), $lte: toDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$loggedAt" } },
          totalHours:    { $sum: "$hours" },
          billableHours: { $sum: { $cond: ["$isBillable", "$hours", 0] } },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", totalHours: 1, billableHours: 1, _id: 0 } },
    ]),
    User.find({ isActive: true }).select("_id name email").sort({ name: 1 }).lean(),
  ]);

  const row = summaryResult[0] ?? { totalHours: 0, billableHours: 0, aiHours: 0, entryCount: 0 };
  const totalHours    = Math.round((row.totalHours ?? 0) * 100) / 100;
  const billableHours = Math.round((row.billableHours ?? 0) * 100) / 100;
  const aiHours       = Math.round((row.aiHours ?? 0) * 100) / 100;

  const stats = {
    totalHours,
    billableHours,
    nonBillableHours: Math.round((totalHours - billableHours) * 100) / 100,
    billablePct: totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0,
    aiHours,
    aiPct: totalHours > 0 ? Math.round((aiHours / totalHours) * 100) : 0,
    entryCount: row.entryCount ?? 0,
  };

  const projectData = projectRows.map((r: { _id: unknown; project: { name: string; clientName?: string | null }; totalHours: number; billableHours: number; entryCount: number }) => ({
    projectId: String(r._id),
    projectName: r.project.name,
    clientName: r.project.clientName ?? null,
    totalHours: Math.round((r.totalHours ?? 0) * 100) / 100,
    billableHours: Math.round((r.billableHours ?? 0) * 100) / 100,
    billablePct: r.totalHours > 0 ? Math.round((r.billableHours / r.totalHours) * 100) : 0,
    entryCount: r.entryCount,
  }));

  const dailyData = fillDailyData(dailyRows, from, to);

  const users = allUsers.map((u: { _id: unknown; name: string; email: string }) => ({
    id: String(u._id),
    name: u.name,
    email: u.email,
  }));

  const selectedUser = users.find((u) => u.id === targetUserId);
  const isViewingOther = targetUserId !== currentUserId;

  return (
    <div>
      <PageHeader
        title="Summary"
        description={
          isViewingOther && selectedUser
            ? `Viewing ${selectedUser.name}'s logged hours`
            : "Your logged hours overview"
        }
      />
      <ReportFilters
        defaultFrom={from}
        defaultTo={to}
        users={users}
        selectedUserId={targetUserId}
        currentUserId={currentUserId}
      />
      <div className="space-y-6">
        <SummaryCards data={stats} />
        <SummaryCharts dailyData={dailyData} stats={stats} />
        <div>
          <h2 className="font-semibold text-sm mb-3">By Project</h2>
          <ProjectBreakdownTable rows={projectData} from={from} to={to} linkable />
        </div>
      </div>
    </div>
  );
}
