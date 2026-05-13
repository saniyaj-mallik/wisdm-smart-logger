import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import ReportSend from "@/models/ReportSend";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const doc = await ReportSend.findByIdAndUpdate(
    params.id,
    { sentAt: new Date(), sentBy: session.user.id },
    { new: true }
  )
    .populate("projectId", "name clientName color reportFrequencyDays isActive")
    .populate("downloadedBy", "name email")
    .populate("sentBy", "name email")
    .lean();

  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const doc = await ReportSend.findByIdAndDelete(params.id);
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return new NextResponse(null, { status: 204 });
}
