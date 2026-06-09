import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { exchangeCodeForTokens } from "@/lib/google-calendar";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) redirect("/login");

  const { searchParams } = new URL(req.url);
  const code  = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    redirect("/profile?calendar=denied");
  }

  try {
    const { accessToken, refreshToken, expiresAt } = await exchangeCodeForTokens(code);

    await connectDB();
    await User.findByIdAndUpdate(session.user.id, {
      googleAccessToken:  accessToken,
      googleRefreshToken: refreshToken,
      googleTokenExpiry:  expiresAt,
    });
  } catch (err) {
    console.error("Google Calendar callback error:", err);
    redirect("/profile?calendar=error");
  }

  redirect("/profile?calendar=connected");
}
