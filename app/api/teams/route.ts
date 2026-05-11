import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Team from "@/models/Team";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const teams = await Team.find({})
    .populate("leaderId", "name email role")
    .populate("memberIds", "name email role")
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json(teams);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Team name is required" }, { status: 400 });

  await connectDB();

  const existing = await Team.findOne({ name: name.trim() });
  if (existing) return NextResponse.json({ error: "A team with this name already exists" }, { status: 409 });

  const team = await Team.create({
    name: name.trim(),
    description: description?.trim() ?? "",
    leaderId: session.user.id,
    memberIds: [],
  });

  const populated = await Team.findById(team._id)
    .populate("leaderId", "name email role")
    .populate("memberIds", "name email role")
    .lean();

  return NextResponse.json(populated, { status: 201 });
}
