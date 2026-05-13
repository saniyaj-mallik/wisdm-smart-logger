import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import CustomField from "@/models/CustomField";
import { UpdateCustomFieldSchema } from "@/lib/zod-schemas";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = UpdateCustomFieldSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await connectDB();
  const field = await CustomField.findById(params.id);
  if (!field) return NextResponse.json({ error: "Not found" }, { status: 404 });

  Object.assign(field, parsed.data);
  await field.save();

  return NextResponse.json(field);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const field = await CustomField.findById(params.id);
  if (!field) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await field.deleteOne();
  return NextResponse.json({ success: true });
}
