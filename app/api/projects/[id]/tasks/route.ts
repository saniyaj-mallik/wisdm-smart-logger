import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Task from "@/models/Task";
import { CreateTaskSchema } from "@/lib/zod-schemas";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const includeArchived = searchParams.get("includeArchived") === "true";

  const query: any = { projectId: params.id };
  if (!includeArchived) query.isActive = true;

  const tasks = await Task.find(query).sort({ name: 1 }).lean();
  return NextResponse.json(tasks);
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateTaskSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectDB();
  const existing = await Task.findOne({ projectId: params.id, name: parsed.data.name });
  if (existing)
    return NextResponse.json({ error: { name: ["Task already exists in this project"] } }, { status: 400 });

  const task = await Task.create({ ...parsed.data, projectId: params.id });
  return NextResponse.json(task, { status: 201 });
}
