import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import TimeEntry from "@/models/TimeEntry";
import { Types } from "mongoose";
import { PageHeader } from "@/components/layout/PageHeader";
import { ProjectBreakdownTable } from "@/components/reports/ProjectBreakdownTable";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { getWeekRange } from "@/lib/time-utils";

export default async function ProjectsReportPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const session = await auth();
  const userId = session!.user.id;
  const role = session!.user.role;
  const isManagerOrAdmin = role === "manager" || role === "admin";

  const defaultRange = getWeekRange();
  const from = searchParams.from ?? defaultRange.from.toISOString().slice(0, 10);
  const to = searchParams.to ?? defaultRange.to.toISOString().slice(0, 10);

  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  const matchStage: Record<string, unknown> = {
    loggedAt: { $gte: new Date(from), $lte: toDate },
  };
  if (!isManagerOrAdmin) {
    matchStage.userId = new Types.ObjectId(userId);
  }

  await connectDB();

  const rows = await TimeEntry.aggregate([
    { $match: matchStage },
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
  ]);

  const data = rows.map((r: { _id: unknown; project: { name: string; clientName?: string | null }; totalHours: number; billableHours: number; entryCount: number }) => ({
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
      <PageHeader
        title="Project Breakdown"
        description="Hours by project for the selected period"
      />
      <ReportFilters defaultFrom={from} defaultTo={to} />
      <ProjectBreakdownTable rows={data} from={from} to={to} linkable />
    </div>
  );
}
