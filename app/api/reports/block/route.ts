import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import TimeEntry from "@/models/TimeEntry";
import User from "@/models/User";
import { Types } from "mongoose";
import "@/models/Project";
import "@/models/Task";
import { BlockReportSchema } from "@/lib/zod-schemas";
import { formatBlock } from "@/lib/block-formatter";
import type { BlockEntry } from "@/lib/block-formatter";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = BlockReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const targetUserId = data.userId ?? session.user.id;

  const toDate = new Date(data.to);
  toDate.setHours(23, 59, 59, 999);

  const filter: Record<string, unknown> = {
    userId: targetUserId,
    loggedAt: { $gte: new Date(data.from), $lte: toDate },
  };

  if (data.billableFilter === "billable") filter.isBillable = true;
  if (data.billableFilter === "non-billable") filter.isBillable = false;
  if (data.projectId) filter.projectId = new Types.ObjectId(data.projectId);
  if (data.taskIds && data.taskIds.length > 0) {
    filter.taskId = { $in: data.taskIds.map((id) => new Types.ObjectId(id)) };
  }

  await connectDB();

  const [rawEntries, userDoc] = await Promise.all([
    TimeEntry.find(filter)
      .sort({ loggedAt: 1, createdAt: 1 })
      .populate("projectId", "name")
      .populate("taskId", "name estimatedHours")
      .lean(),
    User.findById(targetUserId).lean(),
  ]);

  const userName = userDoc?.name ?? session.user.name ?? "Unknown";

  const entries: BlockEntry[] = rawEntries.map((e) => ({
    loggedAt: e.loggedAt as Date,
    projectName: (e.projectId as { name: string }).name ?? "Unknown",
    taskName: (e.taskId as { name: string; estimatedHours?: number }).name ?? "Unknown",
    estimatedHours: (e.taskId as { estimatedHours?: number }).estimatedHours ?? null,
    hours: e.hours ?? 0,
    isBillable: e.isBillable,
    aiUsed: e.aiUsed,
    notes: e.notes ?? null,
  }));

  const block = formatBlock(entries, {
    from: data.from,
    to: data.to,
    groupBy: data.groupBy,
    format: data.format,
  }, userName);

  return NextResponse.json({ block });
}
