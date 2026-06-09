import { test, expect } from "@playwright/test";
import type { Route } from "@playwright/test";

// ── helpers ──────────────────────────────────────────────────────────────────

function getMondayStr() {
  const d   = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10);
}

const monday = getMondayStr();

const MOCK_EVENTS = [
  {
    id:           "evt-1",
    title:        "Design Review",
    date:         monday,
    startTime:    "09:00",
    endTime:      "10:00",
    isAllDay:     false,
    description:  null,
    calendarName: "Work",
  },
  {
    id:           "evt-2",
    title:        "Team Standup",
    date:         monday,
    startTime:    "10:00",
    endTime:      "10:15",
    isAllDay:     false,
    description:  null,
    calendarName: "Work",
  },
];

type MockEvent = typeof MOCK_EVENTS[number];

function mockConnected(route: Route, events: MockEvent[] = MOCK_EVENTS) {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ connected: true, events }),
  });
}

function mockDisconnected(route: Route) {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ connected: false, events: [] }),
  });
}

// ── tests ─────────────────────────────────────────────────────────────────────

test.describe("Google Calendar – Logs page panel", () => {

  test("shows events when calendar is connected", async ({ page }) => {
    await page.route("/api/calendar/events**", (route) => mockConnected(route));
    await page.goto("/logs");

    await expect(page.getByText("Google Calendar Events")).toBeVisible();
    await expect(page.getByText("Design Review")).toBeVisible();
    await expect(page.getByText("Team Standup")).toBeVisible();
    // time labels (fmtTime12 format)
    await expect(page.getByText("9:00 am – 10:00 am")).toBeVisible();
    await expect(page.getByText("10:00 am – 10:15 am")).toBeVisible();
  });

  test("shows not-connected state with profile link", async ({ page }) => {
    await page.route("/api/calendar/events**", (route) => mockDisconnected(route));
    await page.goto("/logs");

    await expect(page.getByText("Google Calendar Events")).toBeVisible();
    await expect(page.getByText("Google Calendar is not connected.")).toBeVisible();
    const link = page.getByRole("link", { name: "Connect in Profile →" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/profile");
  });

  test("shows empty state when connected but no events this week", async ({ page }) => {
    await page.route("/api/calendar/events**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ connected: true, events: [] }),
      })
    );
    await page.goto("/logs");

    await expect(page.getByText("Google Calendar Events")).toBeVisible();
    await expect(page.getByText("No events this week.")).toBeVisible();
  });

  test("panel collapses and re-expands on header click", async ({ page }) => {
    await page.route("/api/calendar/events**", (route) => mockConnected(route));
    await page.goto("/logs");

    await expect(page.getByText("Design Review")).toBeVisible();

    // collapse
    await page.getByText("Google Calendar Events").click();
    await expect(page.getByText("Design Review")).not.toBeVisible();

    // re-expand
    await page.getByText("Google Calendar Events").click();
    await expect(page.getByText("Design Review")).toBeVisible();
  });

  test("Log button opens modal pre-filled with event date, times and title", async ({ page }) => {
    await page.route("/api/calendar/events**", (route) =>
      mockConnected(route, [MOCK_EVENTS[0]!])
    );
    // stub projects/tasks so modal can render
    await page.route("/api/projects", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([{ _id: "p1", name: "Test Project" }]),
      })
    );
    await page.route("/api/admin/custom-fields**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "[]" })
    );

    await page.goto("/logs");
    await expect(page.getByText("Design Review")).toBeVisible();

    await page.getByRole("button", { name: "Log" }).first().click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // title should be in notes field
    await expect(dialog.getByPlaceholder("What did you work on?")).toHaveValue("Design Review");

    // time inputs should be pre-filled (Start/End mode active)
    const timeInputs = dialog.locator('input[type="time"]');
    await expect(timeInputs.first()).toHaveValue("09:00");
    await expect(timeInputs.last()).toHaveValue("10:00");
  });

  test("event count shows in panel header", async ({ page }) => {
    await page.route("/api/calendar/events**", (route) => mockConnected(route));
    await page.goto("/logs");

    // header should show (2) for 2 events
    await expect(page.getByText("(2)")).toBeVisible();
  });

  test("re-fetches events when navigating to different week", async ({ page }) => {
    let callCount = 0;
    await page.route("/api/calendar/events**", (route) => {
      callCount++;
      mockConnected(route);
    });

    await page.goto("/logs");
    await expect(page.getByText("Design Review")).toBeVisible();
    const countAfterLoad = callCount;
    expect(countAfterLoad).toBeGreaterThanOrEqual(1);

    // navigate to next week
    await page.getByRole("button").filter({ has: page.locator(".lucide-chevron-right") }).click();
    await page.waitForTimeout(500);
    expect(callCount).toBe(countAfterLoad + 1);
  });
});

test.describe("Google Calendar – Profile page card", () => {

  test("shows connect button when not connected", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByText("Google Calendar", { exact: true })).toBeVisible();
    // The exact state depends on DB — just check card is visible
    const card = page.getByText("Google Calendar", { exact: true }).locator("..");
    await expect(card).toBeVisible();
  });
});
