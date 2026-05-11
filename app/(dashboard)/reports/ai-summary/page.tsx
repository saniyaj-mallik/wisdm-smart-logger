import { connectDB } from "@/lib/mongodb";
import TimeEntry from "@/models/TimeEntry";
import Team from "@/models/Team";
import "@/models/Project";
import "@/models/Task";
import { Types } from "mongoose";
import { PageHeader } from "@/components/layout/PageHeader";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { TeamFilter } from "./TeamFilter";
import { AISummaryTables } from "./AISummaryTables";
import { Sparkles, Zap, Users } from "lucide-react";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

// ── helpers ───────────────────────────────────────────────────────────────────
function getDefaultRange() {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
  };
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

const ROLE_LABEL: Record<string, string> = {
  dev: "Developer",
  sme: "SME",
  manager: "Manager",
  admin: "Admin",
};

// ── mini components ───────────────────────────────────────────────────────────
function RateBar({ value, color = "bg-violet-500" }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2 justify-end">
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-semibold w-8 text-right tabular-nums">{value}%</span>
    </div>
  );
}

function OverviewCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  sub,
  barValue,
  barColor,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  sub: string;
  barValue?: number;
  barColor?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", iconBg)}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
      {barValue !== undefined && (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full", barColor)}
            style={{ width: `${Math.min(barValue, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────
export default async function AISummaryPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; teamId?: string };
}) {
  const defaults = getDefaultRange();
  const from = searchParams.from ?? defaults.from;
  const to = searchParams.to ?? defaults.to;
  const selectedTeamId = searchParams.teamId ?? null;

  const fromDate = new Date(from);
  const toDate = new Date(to + "T23:59:59.999Z");

  await connectDB();

  const allTeams = await Team.find({}, "name").sort({ name: 1 }).lean();

  const match: Record<string, unknown> = { loggedAt: { $gte: fromDate, $lte: toDate } };
  if (selectedTeamId) {
    const team = await Team.findById(selectedTeamId, "leaderId memberIds").lean() as { leaderId: Types.ObjectId; memberIds: Types.ObjectId[] } | null;
    if (team) {
      const memberSet = new Map<string, Types.ObjectId>();
      if (team.leaderId) memberSet.set(String(team.leaderId), new Types.ObjectId(String(team.leaderId)));
      for (const id of team.memberIds ?? []) memberSet.set(String(id), new Types.ObjectId(String(id)));
      if (memberSet.size > 0) match.userId = { $in: Array.from(memberSet.values()) };
    }
  }

  const [userRows, taskRows] = await Promise.all([
    // ── by user (group by userId+taskId first to avoid double-counting estimates) ──
    TimeEntry.aggregate([
      { $match: match },
      { $lookup: { from: "tasks", localField: "taskId", foreignField: "_id", as: "task" } },
      { $unwind: { path: "$task", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { userId: "$userId", taskId: "$taskId" },
          taskTotalHours: { $sum: "$hours" },
          taskAiHours:    { $sum: { $cond: [{ $eq: ["$aiUsed", true] }, "$hours", 0] } },
          taskTotalEntries: { $sum: 1 },
          taskAiEntries:  { $sum: { $cond: [{ $eq: ["$aiUsed", true] }, 1, 0] } },
          estimatedHours: { $first: "$task.estimatedHours" },
        },
      },
      {
        $group: {
          _id: "$_id.userId",
          totalHours:   { $sum: "$taskTotalHours" },
          aiHours:      { $sum: "$taskAiHours" },
          totalEntries: { $sum: "$taskTotalEntries" },
          aiEntries:    { $sum: "$taskAiEntries" },
          savedHours: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ["$taskAiEntries", 0] },
                    { $gt: [{ $ifNull: ["$estimatedHours", 0] }, "$taskTotalHours"] },
                  ],
                },
                { $subtract: ["$estimatedHours", "$taskTotalHours"] },
                0,
              ],
            },
          },
        },
      },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $sort: { aiHours: -1 } },
    ]),

    // ── by task + user ────────────────────────────────────────────────────
    TimeEntry.aggregate([
      { $match: match },
      {
        $group: {
          _id: { taskId: "$taskId", userId: "$userId" },
          totalHours: { $sum: "$hours" },
          aiHoursSum: { $sum: { $cond: [{ $eq: ["$aiUsed", true] }, "$hours", 0] } },
          nonAiHoursSum: { $sum: { $cond: [{ $ne: ["$aiUsed", true] }, "$hours", 0] } },
          aiEntries: { $sum: { $cond: [{ $eq: ["$aiUsed", true] }, 1, 0] } },
          nonAiEntries: { $sum: { $cond: [{ $ne: ["$aiUsed", true] }, 1, 0] } },
          totalEntries: { $sum: 1 },
        },
      },
      { $lookup: { from: "tasks", localField: "_id.taskId", foreignField: "_id", as: "task" } },
      { $unwind: { path: "$task", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "projects",
          localField: "task.projectId",
          foreignField: "_id",
          as: "project",
        },
      },
      { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "users", localField: "_id.userId", foreignField: "_id", as: "user" } },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      { $sort: { totalHours: -1 } },
    ]),
  ]);

  // ── process users ─────────────────────────────────────────────────────────
  const users = userRows.map((r) => ({
    userId: String(r._id),
    name: r.user?.name ?? "Unknown",
    role: r.user?.role ?? "dev",
    totalHours: r2(r.totalHours ?? 0),
    aiHours: r2(r.aiHours ?? 0),
    totalEntries: r.totalEntries as number,
    aiEntries: r.aiEntries as number,
    savedHours: r2(r.savedHours ?? 0),
  }));

  // ── process tasks ─────────────────────────────────────────────────────────
  const tasks = taskRows.map((r) => {
    const avgWithAI = r.aiEntries > 0 ? r2(r.aiHoursSum / r.aiEntries) : null;
    const avgWithoutAI = r.nonAiEntries > 0 ? r2(r.nonAiHoursSum / r.nonAiEntries) : null;
    const est: number | null = r.task?.estimatedHours ?? null;

    let savedHours: number | null = null;
    let savedPct: number | null = null;
    if (avgWithAI !== null && avgWithoutAI !== null && avgWithoutAI > 0) {
      savedHours = r2(avgWithoutAI - avgWithAI);
      savedPct = Math.round((savedHours / avgWithoutAI) * 100);
    }

    const totalHoursTask = r2(r.totalHours ?? 0);

    let vsEstimatePct: number | null = null;
    if (totalHoursTask > 0 && est && est > 0) {
      vsEstimatePct = Math.round(((est - totalHoursTask) / est) * 100);
    }

    return {
      taskId: String(r._id?.taskId ?? r._id),
      userId: String(r._id?.userId ?? ""),
      userName: r.user?.name ?? "Unknown",
      taskName: r.task?.name ?? "Unknown",
      projectName: r.project?.name ?? "Unknown",
      estimatedHours: est,
      avgWithAI,
      avgWithoutAI,
      aiEntries: r.aiEntries as number,
      nonAiEntries: r.nonAiEntries as number,
      totalEntries: r.totalEntries as number,
      totalHours: totalHoursTask,
      savedHours,
      savedPct,
      vsEstimatePct,
    };
  });

  // ── overview metrics ──────────────────────────────────────────────────────
  const totalHours = r2(users.reduce((s, u) => s + u.totalHours, 0));
  const totalAiHours = r2(users.reduce((s, u) => s + u.aiHours, 0));
  const totalEntries = users.reduce((s, u) => s + u.totalEntries, 0);
  const totalAiEntries = users.reduce((s, u) => s + u.aiEntries, 0);
  const aiAdoptionRate = pct(totalAiEntries, totalEntries);
  const activeAiUsers = users.filter((u) => u.aiEntries > 0).length;

  // ── task efficiency (has comparisons) ─────────────────────────────────────
  const efficiencyTasks = tasks
    .filter((t) => (t.savedHours !== null && t.savedHours > 0) || (t.vsEstimatePct !== null && t.vsEstimatePct > 0))
    .sort((a, b) => {
      const aScore = a.savedPct ?? (a.vsEstimatePct ?? 0) / 2;
      const bScore = b.savedPct ?? (b.vsEstimatePct ?? 0) / 2;
      return bScore - aScore;
    })
    .slice(0, 15);

  // ── tasks with zero AI ────────────────────────────────────────────────────
  const noAiTasks = tasks
    .filter((t) => t.aiEntries === 0 && t.totalEntries >= 1)
    .sort((a, b) => b.totalHours - a.totalHours)
    .slice(0, 20);

  const hasData = totalEntries > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Analytics"
        description="Track how AI adoption impacts team efficiency, task estimates, and time savings"
      />

      <Suspense>
        <ReportFilters defaultFrom={from} defaultTo={to}>
          <TeamFilter teams={JSON.parse(JSON.stringify(allTeams))} />
        </ReportFilters>
      </Suspense>

      {!hasData ? (
        <div className="rounded-xl border border-border bg-muted/20 p-16 text-center">
          <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground text-sm">No time entries found in this period.</p>
        </div>
      ) : (
        <>
          {/* ── Overview cards ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <OverviewCard
              icon={Sparkles}
              iconBg="bg-violet-500/10"
              iconColor="text-violet-500"
              label="AI Hours"
              value={`${totalAiHours}h`}
              sub={`of ${totalHours}h total logged`}
              barValue={pct(totalAiHours, totalHours)}
              barColor="bg-violet-500"
            />
            <OverviewCard
              icon={Zap}
              iconBg="bg-blue-500/10"
              iconColor="text-blue-500"
              label="Adoption Rate"
              value={`${aiAdoptionRate}%`}
              sub={`${totalAiEntries} of ${totalEntries} entries`}
              barValue={aiAdoptionRate}
              barColor="bg-blue-500"
            />
            <OverviewCard
              icon={Users}
              iconBg="bg-amber-500/10"
              iconColor="text-amber-500"
              label="AI-Active Users"
              value={String(activeAiUsers)}
              sub={`of ${users.length} team members`}
              barValue={pct(activeAiUsers, users.length)}
              barColor="bg-amber-500"
            />
          </div>

          <AISummaryTables
            users={users}
            efficiencyTasks={efficiencyTasks}
            noAiTasks={noAiTasks}
          />
        </>
      )}
    </div>
  );
}
