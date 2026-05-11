import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Team from "@/models/Team";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const team = await Team.findById(params.id);
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  if (String(team.leaderId) !== session.user.id) {
    return NextResponse.json({ error: "Only the team leader can update the team" }, { status: 403 });
  }

  const { name, description } = await req.json();
  if (name?.trim()) team.name = name.trim();
  if (description !== undefined) team.description = description.trim();
  await team.save();

  const updated = await Team.findById(team._id)
    .populate("leaderId", "name email role")
    .populate("memberIds", "name email role")
    .lean();

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const team = await Team.findById(params.id);
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  if (String(team.leaderId) !== session.user.id) {
    return NextResponse.json({ error: "Only the team leader can delete the team" }, { status: 403 });
  }

  await Team.deleteOne({ _id: params.id });
  return NextResponse.json({ success: true });
}
