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
    const { accessToken, refreshToken, expiresAt } = await exchangeCodeForTokens(code!);

    // Google only returns refresh_token on first authorization or after revoke+reauth.
    // If missing, the previous refresh token (if any) is still valid — don't overwrite it.
    if (!refreshToken) {
      console.warn("[calendar/callback] No refresh_token in response — user may need to revoke and reconnect.");
      redirect("/profile?calendar=error");
    }

    await connectDB();
    await User.findByIdAndUpdate(session.user.id, {
      googleAccessToken:  accessToken,
      googleRefreshToken: refreshToken,
      googleTokenExpiry:  expiresAt,
    });
  } catch (err) {
    console.error("[calendar/callback] Error:", err);
    redirect("/profile?calendar=error");
  }

  redirect("/profile?calendar=connected");
}
