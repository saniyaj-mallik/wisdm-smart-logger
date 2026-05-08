import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { UpdateProfileSchema } from "@/lib/zod-schemas";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = UpdateProfileSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (parsed.data.name) user.name = parsed.data.name;

  if (parsed.data.newPassword) {
    const valid = await bcrypt.compare(
      parsed.data.currentPassword!,
      user.passwordHash
    );
    if (!valid)
      return NextResponse.json(
        { error: { currentPassword: ["Incorrect password"] } },
        { status: 400 }
      );
    user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  }

  await user.save();
  return NextResponse.json({ success: true });
}
