import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { fetchCalendarEvents, refreshAccessToken } from "@/lib/google-calendar";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to   = searchParams.get("to");
  if (!from || !to) return NextResponse.json({ error: "from and to are required" }, { status: 400 });

  await connectDB();
  const user = await User.findById(session.user.id)
    .select("googleAccessToken googleRefreshToken googleTokenExpiry")
    .lean() as {
      googleAccessToken:  string | null;
      googleRefreshToken: string | null;
      googleTokenExpiry:  number | null;
    } | null;

  if (!user?.googleRefreshToken) {
    return NextResponse.json({ connected: false, events: [] });
  }

  let accessToken = user.googleAccessToken;
  const expiry    = user.googleTokenExpiry ?? 0;

  // Refresh if expired or missing
  if (!accessToken || Date.now() >= expiry) {
    try {
      const refreshed = await refreshAccessToken(user.googleRefreshToken);
      accessToken = refreshed.accessToken;
      await User.findByIdAndUpdate(session.user.id, {
        googleAccessToken: refreshed.accessToken,
        googleTokenExpiry: refreshed.expiresAt,
      });
    } catch {
      // Refresh token invalid — clear and ask user to reconnect
      await User.findByIdAndUpdate(session.user.id, {
        googleAccessToken:  null,
        googleRefreshToken: null,
        googleTokenExpiry:  null,
      });
      return NextResponse.json({ connected: false, events: [] });
    }
  }

  try {
    const events = await fetchCalendarEvents(accessToken!, from, to);
    return NextResponse.json({ connected: true, events });
  } catch {
    return NextResponse.json({ connected: true, events: [], error: "Failed to fetch events" });
  }
}
