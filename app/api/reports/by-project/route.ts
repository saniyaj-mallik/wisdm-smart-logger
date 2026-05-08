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
  if (!from || !to) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  }

  const targetUserId = searchParams.get("userId") ?? null;

  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  const matchStage: Record<string, unknown> = {
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

  const data = rows.map((r) => ({
    projectId: r._id,
    projectName: r.project.name,
    clientName: r.project.clientName ?? null,
    totalHours: Math.round((r.totalHours ?? 0) * 100) / 100,
    billableHours: Math.round((r.billableHours ?? 0) * 100) / 100,
    billablePct: r.totalHours > 0 ? Math.round((r.billableHours / r.totalHours) * 100) : 0,
    entryCount: r.entryCount,
  }));

  return NextResponse.json(data);
}
