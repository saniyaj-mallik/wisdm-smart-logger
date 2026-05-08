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

  const targetUserId = searchParams.get("userId") ?? session.user.id;

  const toDate = new Date(to);
  toDate.setHours(23, 59, 59, 999);

  await connectDB();

  const result = await TimeEntry.aggregate([
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
  ]);

  const row = result[0] ?? { totalHours: 0, billableHours: 0, aiHours: 0, entryCount: 0 };
  const totalHours    = Math.round((row.totalHours ?? 0) * 100) / 100;
  const billableHours = Math.round((row.billableHours ?? 0) * 100) / 100;
  const aiHours       = Math.round((row.aiHours ?? 0) * 100) / 100;

  return NextResponse.json({
    totalHours,
    billableHours,
    nonBillableHours: Math.round((totalHours - billableHours) * 100) / 100,
    billablePct: totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0,
    aiHours,
    aiPct: totalHours > 0 ? Math.round((aiHours / totalHours) * 100) : 0,
    entryCount: row.entryCount ?? 0,
  });
}
