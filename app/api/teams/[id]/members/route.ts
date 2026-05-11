import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Team from "@/models/Team";
import User from "@/models/User";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const team = await Team.findById(params.id);
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  if (String(team.leaderId) !== session.user.id) {
    return NextResponse.json({ error: "Only the team leader can add members" }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  const user = await User.findById(userId).select("name email role isActive");
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!user.isActive) return NextResponse.json({ error: "Cannot add inactive user" }, { status: 400 });

  if (String(team.leaderId) === userId) {
    return NextResponse.json({ error: "The team leader is already part of the team" }, { status: 400 });
  }

  const alreadyMember = team.memberIds.some((id: Types.ObjectId) => String(id) === userId);
  if (alreadyMember) return NextResponse.json({ error: "User is already a team member" }, { status: 409 });

  team.memberIds.push(user._id);
  await team.save();

  const updated = await Team.findById(team._id)
    .populate("leaderId", "name email role")
    .populate("memberIds", "name email role")
    .lean();

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const team = await Team.findById(params.id);
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  if (String(team.leaderId) !== session.user.id) {
    return NextResponse.json({ error: "Only the team leader can remove members" }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });

  team.memberIds = team.memberIds.filter((id: Types.ObjectId) => String(id) !== userId);
  await team.save();

  const updated = await Team.findById(team._id)
    .populate("leaderId", "name email role")
    .populate("memberIds", "name email role")
    .lean();

  return NextResponse.json(updated);
}
