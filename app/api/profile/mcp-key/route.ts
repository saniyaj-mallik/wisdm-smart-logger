import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { hashApiKey } from "@/lib/mcp-auth";
import crypto from "crypto";

function generateApiKey(): string {
  return "sl_" + crypto.randomBytes(32).toString("hex");
}

function makeHint(key: string): string {
  return key.slice(0, 7) + "..." + key.slice(-4);
}

export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.user.id).select("mcpApiKeyHint");
  if (!user)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    hasKey: !!user.mcpApiKeyHint,
    hint: user.mcpApiKeyHint ?? null,
  });
}

export async function POST() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const key = generateApiKey();
  user.mcpApiKeyHash = hashApiKey(key);
  user.mcpApiKeyHint = makeHint(key);
  await user.save();

  return NextResponse.json({ key, hint: user.mcpApiKeyHint });
}

export async function DELETE() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.user.id);
  if (!user)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  user.mcpApiKeyHash = null;
  user.mcpApiKeyHint = null;
  await user.save();

  return NextResponse.json({ success: true });
}
