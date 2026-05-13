import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import CustomField from "@/models/CustomField";
import { CreateCustomFieldSchema } from "@/lib/zod-schemas";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get("active") === "true";

  await connectDB();
  const filter = activeOnly ? { isActive: true } : {};
  const fields = await CustomField.find(filter).sort({ createdAt: 1 }).lean();

  return NextResponse.json(fields);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = CreateCustomFieldSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await connectDB();
  const field = await CustomField.create({
    label: parsed.data.label,
    type: parsed.data.type,
    unit: parsed.data.unit ?? null,
  });

  return NextResponse.json(field, { status: 201 });
}
