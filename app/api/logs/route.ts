import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import TimeEntry from "@/models/TimeEntry";
import "@/models/Project";
import "@/models/Task";
import "@/models/CustomField";
import { CreateLogSchema } from "@/lib/zod-schemas";
import { computeHours, stripTime } from "@/lib/time-utils";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  const filter: Record<string, unknown> = {};

  const userId = searchParams.get("userId");
  if (userId) filter.userId = userId;

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (from || to) {
    filter.loggedAt = {};
    if (from) (filter.loggedAt as Record<string, unknown>).$gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      (filter.loggedAt as Record<string, unknown>).$lte = toDate;
    }
  }

  if (searchParams.get("projectId")) filter.projectId = searchParams.get("projectId");
  if (searchParams.get("taskId")) filter.taskId = searchParams.get("taskId");

  await connectDB();
  const entries = await TimeEntry.find(filter)
    .sort({ loggedAt: -1, createdAt: -1 })
    .limit(200)
    .populate("projectId", "name")
    .populate("taskId", "name")
    .populate("userId", "name email")
    .populate("customFields.fieldId", "label type unit")
    .lean();

  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  let hours = data.hours ?? null;
  if (hours == null && data.startTime && data.endTime) {
    hours = computeHours(data.startTime, data.endTime);
  }

  await connectDB();
  const entry = await TimeEntry.create({
    userId: session.user.id,
    projectId: data.projectId,
    taskId: data.taskId,
    hours,
    startTime: data.startTime ?? null,
    endTime: data.endTime ?? null,
    loggedAt: stripTime(data.loggedAt),
    isBillable: data.isBillable,
    aiUsed: data.aiUsed,
    notes: data.notes ?? null,
    customFields: data.customFields ?? [],
  });

  return NextResponse.json(entry, { status: 201 });
}
