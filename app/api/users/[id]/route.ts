import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { UpdateUserRoleSchema } from "@/lib/zod-schemas";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = UpdateUserRoleSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await connectDB();
  const user = await User.findByIdAndUpdate(params.id, parsed.data, {
    new: true,
  }).select("-passwordHash");
  if (!user)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(user);
}
