import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import TimeEntry from "@/models/TimeEntry";
import Project from "@/models/Project";
import { Types } from "mongoose";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReportFilters } from "@/components/reports/ReportFilters";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Inbox } from "lucide-react";
import { getWeekRange } from "@/lib/time-utils";

export default async function ProjectTaskBreakdownPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { from?: string; to?: string };
}) {
  const session = await auth();
  const userId = session!.user.id;
  const role = session!.user.role;
  const isManagerOrAdmin = role === "manager" || role === "admin";

  await connectDB();

  const project = await Project.findById(params.id).lean();
  if (!project) notFound();

  const defaultRange = getWeekRange();
  const from = searchParams.from ?? defaultRange.from.toISOString().slice(0, 10);
  const to = searchParams.to ?? defaultRange.to.toISOString().slice(0, 10);

  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  const matchStage: Record<string, unknown> = {
    projectId: new Types.ObjectId(params.id),
    loggedAt: { $gte: new Date(from), $lte: toDate },
  };
  if (!isManagerOrAdmin) {
    matchStage.userId = new Types.ObjectId(userId);
  }

  const rows = await TimeEntry.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: "$taskId",
        totalHours: { $sum: "$hours" },
        entryCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "tasks",
        localField: "_id",
        foreignField: "_id",
        as: "task",
      },
    },
    { $unwind: "$task" },
    { $sort: { totalHours: -1 } },
  ]);

  const data = rows.map((r: { _id: unknown; task: { name: string; estimatedHours?: number | null }; totalHours: number; entryCount: number }) => ({
    taskId: String(r._id),
    taskName: r.task.name,
    estimatedHours: r.task.estimatedHours ?? null,
    totalHours: Math.round((r.totalHours ?? 0) * 100) / 100,
    entryCount: r.entryCount,
  }));

  return (
    <div>
      <PageHeader
        title={project.name}
        description={`Task breakdown${project.clientName ? ` · ${project.clientName}` : ""}`}
      />
      <ReportFilters defaultFrom={from} defaultTo={to} />
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Estimated</TableHead>
              <TableHead>Logged</TableHead>
              <TableHead>Entries</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Inbox className="h-7 w-7" />
                    <p className="text-sm">No data for this period</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => (
                <TableRow key={row.taskId}>
                  <TableCell className="font-medium text-sm">{row.taskName}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {row.estimatedHours ? `${row.estimatedHours}h` : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{row.totalHours}h</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.entryCount}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
