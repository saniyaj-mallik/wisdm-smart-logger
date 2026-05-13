import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import CustomField from "@/models/CustomField";
import TimeEntry from "@/models/TimeEntry";
import "@/models/CustomField";
import { Types } from "mongoose";

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function fillDates(
  raw: { date: string; count: number; total: number }[],
  from: string,
  to: string
) {
  const map = new Map(raw.map((r) => [r.date, r]));
  const result: { date: string; count: number; total: number }[] = [];
  const cur = new Date(from + "T00:00:00");
  const end = new Date(to + "T00:00:00");
  while (cur <= end) {
    const key = cur.toISOString().slice(0, 10);
    result.push(map.get(key) ?? { date: key, count: 0, total: 0 });
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const range = defaultRange();
  const from = searchParams.get("from") ?? range.from;
  const to   = searchParams.get("to")   ?? range.to;

  const fromDate = new Date(from + "T00:00:00");
  const toDate   = new Date(to   + "T23:59:59.999");
  const fieldOid = new Types.ObjectId(params.id);

  await connectDB();

  const field = await CustomField.findById(params.id).lean();
  if (!field) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const dateMatch = { loggedAt: { $gte: fromDate, $lte: toDate } };
  const fieldMatch = { "customFields.fieldId": fieldOid, ...dateMatch };

  const [
    overviewRaw,
    totalEntries,
    dailyRaw,
    byUserRaw,
    byProjectRaw,
    recentEntries,
  ] = await Promise.all([
    // Overview
    TimeEntry.aggregate([
      { $unwind: "$customFields" },
      { $match: { "customFields.fieldId": fieldOid, ...dateMatch } },
      {
        $group: {
          _id: null,
          count:   { $sum: 1 },
          numSum:  { $sum: { $cond: [{ $isNumber: "$customFields.value" }, "$customFields.value", 0] } },
          numMin:  { $min: { $cond: [{ $isNumber: "$customFields.value" }, "$customFields.value", null] } },
          numMax:  { $max: { $cond: [{ $isNumber: "$customFields.value" }, "$customFields.value", null] } },
          values:  { $push: "$customFields.value" },
        },
      },
    ]),

    // Total entries in range (for %)
    TimeEntry.countDocuments(dateMatch),

    // Daily trend
    TimeEntry.aggregate([
      { $unwind: "$customFields" },
      { $match: { "customFields.fieldId": fieldOid, ...dateMatch } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$loggedAt" } },
          count: { $sum: 1 },
          total: { $sum: { $cond: [{ $isNumber: "$customFields.value" }, "$customFields.value", 0] } },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: "$_id", count: 1, total: 1 } },
    ]),

    // By user
    TimeEntry.aggregate([
      { $unwind: "$customFields" },
      { $match: { "customFields.fieldId": fieldOid, ...dateMatch } },
      {
        $group: {
          _id: "$userId",
          count: { $sum: 1 },
          sum:   { $sum: { $cond: [{ $isNumber: "$customFields.value" }, "$customFields.value", 0] } },
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
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          name:  "$user.name",
          email: "$user.email",
          count: 1,
          sum:   1,
        },
      },
    ]),

    // By project
    TimeEntry.aggregate([
      { $unwind: "$customFields" },
      { $match: { "customFields.fieldId": fieldOid, ...dateMatch } },
      {
        $group: {
          _id: "$projectId",
          count: { $sum: 1 },
          sum:   { $sum: { $cond: [{ $isNumber: "$customFields.value" }, "$customFields.value", 0] } },
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
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          name:  "$project.name",
          count: 1,
          sum:   1,
        },
      },
    ]),

    // Recent entries
    TimeEntry.find(fieldMatch)
      .sort({ loggedAt: -1 })
      .limit(20)
      .populate("userId", "name email")
      .populate("projectId", "name")
      .populate("taskId", "name")
      .lean(),
  ]);

  const ov = overviewRaw[0] ?? { count: 0, numSum: 0, numMin: null, numMax: null, values: [] };

  // Text top-values
  let topValues: { value: string; count: number }[] = [];
  if (field.type === "text") {
    const freq: Record<string, number> = {};
    for (const v of ov.values as unknown[]) {
      if (typeof v === "string" && v.trim()) {
        freq[v.trim()] = (freq[v.trim()] ?? 0) + 1;
      }
    }
    topValues = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([value, count]) => ({ value, count }));
  }

  const overview = {
    count: ov.count,
    totalEntries,
    usagePct: totalEntries > 0 ? Math.round((ov.count / totalEntries) * 100) : 0,
    ...(field.type === "number" && ov.count > 0
      ? {
          sum: Math.round(ov.numSum * 100) / 100,
          avg: Math.round((ov.numSum / ov.count) * 100) / 100,
          min: ov.numMin,
          max: ov.numMax,
        }
      : {}),
    ...(field.type === "text" ? { topValues } : {}),
  };

  // Map recent entries
  const recent = recentEntries.map((e) => {
    const cf = (e.customFields as { fieldId: Types.ObjectId; value: unknown }[]).find(
      (c) => c.fieldId.toString() === params.id
    );
    return {
      date:        e.loggedAt,
      userName:    (e.userId as { name: string } | null)?.name ?? "—",
      userEmail:   (e.userId as { email: string } | null)?.email ?? "",
      projectName: (e.projectId as { name: string } | null)?.name ?? "—",
      taskName:    (e.taskId as { name: string } | null)?.name ?? "—",
      value:       cf?.value ?? null,
    };
  });

  return NextResponse.json({
    field: { _id: field._id, label: field.label, type: field.type, unit: field.unit },
    from,
    to,
    overview,
    dailyTrend:    fillDates(dailyRaw, from, to),
    byUser:        byUserRaw,
    byProject:     byProjectRaw,
    recentEntries: recent,
  });
}
