import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import TimeEntry from "@/models/TimeEntry";
import "@/models/Project";
import "@/models/Task";
import { UpdateLogSchema } from "@/lib/zod-schemas";
import { computeHours, stripTime } from "@/lib/time-utils";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const entry = await TimeEntry.findById(params.id)
    .populate("projectId", "name")
    .populate("taskId", "name")
    .populate("userId", "name email")
    .lean();

  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(entry);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = UpdateLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await connectDB();
  const entry = await TimeEntry.findById(params.id);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates = parsed.data;

  if (updates.hours == null && updates.startTime && updates.endTime) {
    updates.hours = computeHours(updates.startTime, updates.endTime);
  }

  if (updates.loggedAt) {
    (updates as Record<string, unknown>).loggedAt = stripTime(updates.loggedAt);
  }

  Object.assign(entry, updates);
  await entry.save();

  return NextResponse.json(entry);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const entry = await TimeEntry.findById(params.id);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await entry.deleteOne();
  return NextResponse.json({ success: true });
}
