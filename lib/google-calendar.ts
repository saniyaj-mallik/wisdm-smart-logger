const GOOGLE_AUTH_URL  = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API     = "https://www.googleapis.com/calendar/v3";
const SCOPES           = "https://www.googleapis.com/auth/calendar.readonly";

export function getCallbackUrl(): string {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base}/api/calendar/callback`;
}

export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id:     process.env.GOOGLE_CLIENT_ID!,
    redirect_uri:  getCallbackUrl(),
    response_type: "code",
    scope:         SCOPES,
    access_type:   "offline",
    prompt:        "consent",
  });
  return `${GOOGLE_AUTH_URL}?${params}`;
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  getCallbackUrl(),
      grant_type:    "authorization_code",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  const data = await res.json();
  return {
    accessToken:  data.access_token  as string,
    refreshToken: data.refresh_token as string,
    expiresAt:    Date.now() + ((data.expires_in as number) - 60) * 1000,
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type:    "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("Failed to refresh access token");
  const data = await res.json();
  return {
    accessToken: data.access_token as string,
    expiresAt:   Date.now() + ((data.expires_in as number) - 60) * 1000,
  };
}

export interface CalendarEvent {
  id:          string;
  title:       string;
  date:        string;        // YYYY-MM-DD
  startTime:   string | null; // HH:MM 24-hour
  endTime:     string | null; // HH:MM 24-hour
  isAllDay:    boolean;
  description: string | null;
}

export async function fetchCalendarEvents(
  accessToken: string,
  from: string,
  to: string
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin:      new Date(from + "T00:00:00").toISOString(),
    timeMax:      new Date(to  + "T23:59:59").toISOString(),
    singleEvents: "true",
    orderBy:      "startTime",
    maxResults:   "50",
  });
  const res = await fetch(`${CALENDAR_API}/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error("Failed to fetch calendar events");
  const data = await res.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data.items ?? []).map((item: any): CalendarEvent => {
    const isAllDay = !!item.start?.date && !item.start?.dateTime;
    let date      = "";
    let startTime: string | null = null;
    let endTime:   string | null = null;

    if (isAllDay) {
      date = item.start.date as string;
    } else {
      const s = new Date(item.start.dateTime as string);
      const e = new Date(item.end.dateTime   as string);
      date      = s.toISOString().slice(0, 10);
      startTime = `${String(s.getHours()).padStart(2, "0")}:${String(s.getMinutes()).padStart(2, "0")}`;
      endTime   = `${String(e.getHours()).padStart(2, "0")}:${String(e.getMinutes()).padStart(2, "0")}`;
    }

    return {
      id:          item.id as string,
      title:       (item.summary as string) ?? "(No title)",
      date,
      startTime,
      endTime,
      isAllDay,
      description: (item.description as string) ?? null,
    };
  });
}
