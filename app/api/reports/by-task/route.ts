import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import TimeEntry from "@/models/TimeEntry";
import { Types } from "mongoose";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const projectId = searchParams.get("projectId");
  if (!from || !to || !projectId) {
    return NextResponse.json({ error: "from, to, and projectId are required" }, { status: 400 });
  }

  const targetUserId = searchParams.get("userId") ?? null;

  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  const matchStage: Record<string, unknown> = {
    projectId: new Types.ObjectId(projectId),
    loggedAt: { $gte: new Date(from), $lte: toDate },
  };
  if (targetUserId) {
    matchStage.userId = new Types.ObjectId(targetUserId);
  }

  await connectDB();

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

  const data = rows.map((r) => ({
    taskId: r._id,
    taskName: r.task.name,
    estimatedHours: r.task.estimatedHours ?? null,
    totalHours: Math.round((r.totalHours ?? 0) * 100) / 100,
    entryCount: r.entryCount,
  }));

  return NextResponse.json(data);
}
