import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Project from "@/models/Project";
import { CreateProjectSchema } from "@/lib/zod-schemas";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const includeArchived = searchParams.get("includeArchived") === "true";

  const query = includeArchived ? {} : { isActive: true };
  const projects = await Project.find(query).sort({ name: 1 }).lean();
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateProjectSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectDB();
  const existing = await Project.findOne({ name: parsed.data.name });
  if (existing)
    return NextResponse.json({ error: { name: ["Project name already exists"] } }, { status: 400 });

  const project = await Project.create(parsed.data);
  return NextResponse.json(project, { status: 201 });
}
