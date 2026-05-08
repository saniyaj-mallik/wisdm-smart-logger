import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import TimeEntry from "@/models/TimeEntry";
import Project from "@/models/Project";
import { Types } from "mongoose";
import { PageHeader } from "@/components/layout/PageHeader";
import { SummaryCards } from "@/components/reports/SummaryCards";
import { ProjectBreakdownTable } from "@/components/reports/ProjectBreakdownTable";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { getWeekRange } from "@/lib/time-utils";

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const session = await auth();
  const userId = session!.user.id;

  const defaultRange = getWeekRange();
  const from = searchParams.from ?? defaultRange.from.toISOString().slice(0, 10);
  const to = searchParams.to ?? defaultRange.to.toISOString().slice(0, 10);

  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  await connectDB();

  const [summaryResult, projectRows] = await Promise.all([
    TimeEntry.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
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
          userId: new Types.ObjectId(userId),
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

  return (
    <div>
      <PageHeader title="Summary" description="Your logged hours overview" />
      <ReportFilters defaultFrom={from} defaultTo={to} />
      <div className="space-y-6">
        <SummaryCards data={stats} />
        <div>
          <h2 className="font-semibold text-sm mb-3">By Project</h2>
          <ProjectBreakdownTable rows={projectData} from={from} to={to} linkable />
        </div>
      </div>
    </div>
  );
}
