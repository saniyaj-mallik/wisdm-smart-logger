import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import ReportSend from "@/models/ReportSend";
import { CreateReportSendSchema } from "@/lib/zod-schemas";

const POPULATE_FIELDS = "name clientName color reportFrequencyDays isActive";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  await connectDB();
  const filter: Record<string, string> = {};
  if (projectId) filter.projectId = projectId;

  const sends = await ReportSend.find(filter)
    .sort({ downloadedAt: -1 })
    .populate("projectId", POPULATE_FIELDS)
    .populate("downloadedBy", "name email")
    .populate("sentBy", "name email")
    .lean();

  return NextResponse.json(sends);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = CreateReportSendSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    await connectDB();
    const doc = await ReportSend.create({
      projectId:    parsed.data.projectId,
      from:         parsed.data.from,
      to:           parsed.data.to,
      format:       parsed.data.format,
      downloadedAt: new Date(),
      downloadedBy: session.user.id,
    });

    const populated = await ReportSend.findById(doc._id)
      .populate("projectId", POPULATE_FIELDS)
      .populate("downloadedBy", "name email")
      .lean();

    return NextResponse.json(populated, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message, code: err?.code }, { status: 500 });
  }
}
