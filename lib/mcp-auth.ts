import { NextRequest } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export type AuthUser = {
  _id: string;
  name: string;
  role: string;
};

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function validateMcpApiKey(
  req: NextRequest
): Promise<AuthUser | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const key = authHeader.slice(7).trim();
  if (!key.startsWith("sl_")) return null;

  const hash = hashApiKey(key);

  await connectDB();
  const user = await User.findOne({ mcpApiKeyHash: hash, isActive: true })
    .select("_id name role")
    .lean();

  if (!user) return null;
  return { _id: user._id.toString(), name: user.name, role: user.role };
}
