import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { refreshAccessToken } from "@/lib/google-calendar";

// Diagnostic endpoint — returns calendar state without exposing token values.
// Visit /api/calendar/debug when logged in to diagnose connection issues.
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.user.id)
    .select("googleAccessToken googleRefreshToken googleTokenExpiry")
    .lean() as {
      googleAccessToken:  string | null;
      googleRefreshToken: string | null;
      googleTokenExpiry:  number | null;
    } | null;

  const hasRefreshToken = !!user?.googleRefreshToken;
  const hasAccessToken  = !!user?.googleAccessToken;
  const expiry          = user?.googleTokenExpiry ?? 0;
  const tokenExpired    = !hasAccessToken || Date.now() >= expiry;
  const expiresInSec    = hasAccessToken ? Math.round((expiry - Date.now()) / 1000) : null;

  if (!hasRefreshToken) {
    return NextResponse.json({
      status: "not_connected",
      hasRefreshToken,
      hasAccessToken,
    });
  }

  // Try to get a valid access token
  let accessToken = user!.googleAccessToken;
  let refreshError: string | null = null;

  if (tokenExpired) {
    try {
      const r = await refreshAccessToken(user!.googleRefreshToken!);
      accessToken = r.accessToken;
    } catch (err) {
      refreshError = String(err);
    }
  }

  if (refreshError || !accessToken) {
    return NextResponse.json({
      status: "token_refresh_failed",
      hasRefreshToken,
      hasAccessToken,
      tokenExpired,
      refreshError,
    });
  }

  // Fetch calendar list to verify scope
  const listRes = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=20", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!listRes.ok) {
    const body = await listRes.text().catch(() => "");
    return NextResponse.json({
      status: "calendar_api_error",
      hasRefreshToken,
      tokenExpired,
      expiresInSec,
      calendarListStatus: listRes.status,
      calendarListError: body.slice(0, 300),
    });
  }

  const listData = await listRes.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calendars = (listData.items ?? []).map((c: any) => ({
    id:       c.id,
    name:     c.summary,
    selected: c.selected,
    access:   c.accessRole,
  }));

  // Sample events from primary for today
  const today = new Date().toISOString().slice(0, 10);
  const sampleParams = new URLSearchParams({
    timeMin:      new Date(today + "T00:00:00Z").toISOString(),
    timeMax:      new Date(today + "T23:59:59Z").toISOString(),
    singleEvents: "true",
    maxResults:   "5",
  });
  const evtRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${sampleParams}`,
    { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
  );
  const evtData = evtRes.ok ? await evtRes.json() : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sampleEvents = (evtData?.items ?? []).map((e: any) => ({
    id:      e.id,
    title:   e.summary,
    start:   e.start,
    status:  e.status,
  }));

  return NextResponse.json({
    status:       "ok",
    hasRefreshToken,
    tokenExpired,
    expiresInSec,
    calendarCount: calendars.length,
    calendars,
    primaryEventsTodayCount: sampleEvents.length,
    sampleEvents,
  });
}
