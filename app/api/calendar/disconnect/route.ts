import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, {
    googleAccessToken:  null,
    googleRefreshToken: null,
    googleTokenExpiry:  null,
  });

  return NextResponse.json({ success: true });
}
