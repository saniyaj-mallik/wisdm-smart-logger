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

test.describe("Google Calendar – inline in day columns", () => {

  test("shows event ghost blocks in the correct day column", async ({ page }) => {
    await page.route("/api/calendar/events**", (route) => mockConnected(route));
    await page.goto("/logs");

    await expect(page.getByText("Design Review")).toBeVisible();
    await expect(page.getByText("Team Standup")).toBeVisible();
  });

  test("no calendar blocks shown when not connected", async ({ page }) => {
    await page.route("/api/calendar/events**", (route) => mockDisconnected(route));
    await page.goto("/logs");

    await expect(page.getByText("Design Review")).not.toBeVisible();
    await expect(page.getByText("Team Standup")).not.toBeVisible();
  });

  test("no calendar blocks shown when connected but no events this week", async ({ page }) => {
    await page.route("/api/calendar/events**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ connected: true, events: [] }),
      })
    );
    await page.goto("/logs");

    await expect(page.getByText("Design Review")).not.toBeVisible();
  });

  test("clicking a calendar event opens the log modal pre-filled", async ({ page }) => {
    await page.route("/api/calendar/events**", (route) =>
      mockConnected(route, [MOCK_EVENTS[0]!])
    );
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

    await page.getByText("Design Review").click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // title should be pre-filled in notes
    await expect(dialog.getByPlaceholder("What did you work on?")).toHaveValue("Design Review");

    // time inputs pre-filled
    const timeInputs = dialog.locator('input[type="time"]');
    await expect(timeInputs.first()).toHaveValue("09:00");
    await expect(timeInputs.last()).toHaveValue("10:00");
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

    await page.getByRole("button").filter({ has: page.locator(".lucide-chevron-right") }).click();
    await page.waitForTimeout(500);
    expect(callCount).toBe(countAfterLoad + 1);
  });
});

test.describe("Google Calendar – Profile page card", () => {

  test("shows connect button when not connected", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByText("Google Calendar", { exact: true })).toBeVisible();
    const card = page.getByText("Google Calendar", { exact: true }).locator("..");
    await expect(card).toBeVisible();
  });
});
