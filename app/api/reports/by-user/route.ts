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

  const projectId = searchParams.get("projectId");
  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  const matchStage: Record<string, unknown> = {
    loggedAt: { $gte: new Date(from), $lte: toDate },
  };
  if (projectId) matchStage.projectId = new Types.ObjectId(projectId);

  await connectDB();

  const rows = await TimeEntry.aggregate([
    { $match: matchStage },
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

  const data = rows.map((r) => ({
    userId: r._id,
    userName: r.user.name,
    userEmail: r.user.email,
    userRole: r.user.role,
    totalHours: Math.round((r.totalHours ?? 0) * 100) / 100,
    billableHours: Math.round((r.billableHours ?? 0) * 100) / 100,
    aiHours: Math.round((r.aiHours ?? 0) * 100) / 100,
    entryCount: r.entryCount,
  }));

  return NextResponse.json(data);
}
