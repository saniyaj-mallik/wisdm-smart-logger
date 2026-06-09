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
  startTime:   string | null; // HH:MM 24-hour (in user's local timezone)
  endTime:     string | null; // HH:MM 24-hour (in user's local timezone)
  isAllDay:    boolean;
  description: string | null;
  calendarName: string | null;
}

// Extract date+time from a Google dateTime string (e.g. "2026-06-09T10:30:00+05:30")
// without converting to UTC — preserves the user's local timezone.
function parseLocalDateTime(dateTimeStr: string): { date: string; time: string } {
  const m = dateTimeStr.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (m) return { date: m[1], time: m[2] };
  // Fallback: UTC
  const d = new Date(dateTimeStr);
  return {
    date: d.toISOString().slice(0, 10),
    time: `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEventItems(items: any[], calendarName: string | null, from: string, to: string): CalendarEvent[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (items ?? []).flatMap((item: any): CalendarEvent[] => {
    if (item.status === "cancelled") return [];

    const isAllDay = !!item.start?.date && !item.start?.dateTime;
    let date      = "";
    let startTime: string | null = null;
    let endTime:   string | null = null;

    if (isAllDay) {
      date = item.start.date as string;
    } else {
      const s = parseLocalDateTime(item.start.dateTime as string);
      const e = parseLocalDateTime(item.end.dateTime   as string);
      date      = s.date;
      startTime = s.time;
      endTime   = e.time;
    }

    // Only include events whose date falls in the requested range
    if (date < from || date > to) return [];

    return [{
      id:           item.id as string,
      title:        (item.summary as string) ?? "(No title)",
      date,
      startTime,
      endTime,
      isAllDay,
      description:  (item.description as string) ?? null,
      calendarName,
    }];
  });
}

async function fetchEventsFromCalendar(
  accessToken: string,
  calendarId: string,
  calendarName: string | null,
  from: string,
  to: string
): Promise<CalendarEvent[]> {
  // Extend the time range by 1 day each side to capture timezone edge cases,
  // then filter by exact date inside parseEventItems.
  const timeMin = new Date(from + "T00:00:00Z");
  timeMin.setUTCDate(timeMin.getUTCDate() - 1);
  const timeMax = new Date(to + "T23:59:59Z");
  timeMax.setUTCDate(timeMax.getUTCDate() + 1);

  const params = new URLSearchParams({
    timeMin:      timeMin.toISOString(),
    timeMax:      timeMax.toISOString(),
    singleEvents: "true",
    orderBy:      "startTime",
    maxResults:   "100",
  });

  const res = await fetch(
    `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return [];
  const data = await res.json();
  return parseEventItems(data.items, calendarName, from, to);
}

export async function fetchCalendarEvents(
  accessToken: string,
  from: string,
  to: string
): Promise<CalendarEvent[]> {
  // Get all calendars the user has enabled
  const listRes = await fetch(`${CALENDAR_API}/users/me/calendarList?maxResults=50`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  let calendars: Array<{ id: string; name: string | null }> = [{ id: "primary", name: null }];
  if (listRes.ok) {
    const listData = await listRes.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    calendars = (listData.items ?? []).map((c: any) => ({
      id:   c.id   as string,
      name: (c.summary as string) ?? null,
    }));
  }

  // Fetch all calendars in parallel
  const eventArrays = await Promise.all(
    calendars.map((cal) => fetchEventsFromCalendar(accessToken, cal.id, cal.name, from, to))
  );

  // Merge, deduplicate by event id, and sort
  const seen = new Set<string>();
  const all: CalendarEvent[] = [];
  for (const events of eventArrays) {
    for (const e of events) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        all.push(e);
      }
    }
  }

  return all.sort((a, b) =>
    a.date !== b.date
      ? a.date.localeCompare(b.date)
      : (a.startTime ?? "").localeCompare(b.startTime ?? "")
  );
}
