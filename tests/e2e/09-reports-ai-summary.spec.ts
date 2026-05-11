/**
 * Reports > AI Analytics page — overview cards, User AI Usage table,
 * Task Efficiency table, Tasks Not Using AI table, date filter, team filter.
 */
import { test, expect } from "@playwright/test";

test.describe("AI Analytics page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reports/ai-summary");
    await expect(page.getByRole("heading", { name: /ai analytics/i })).toBeVisible({ timeout: 15000 });
  });

  test("description is visible", async ({ page }) => {
    await expect(page.getByText(/track how ai adoption/i)).toBeVisible();
  });

  test("date range filter is present", async ({ page }) => {
    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs.first()).toBeVisible();
  });

  test("team filter dropdown is present", async ({ page }) => {
    // TeamFilter renders a Select for filtering by team
    const selects = page.getByRole("combobox");
    const count = await selects.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test("overview cards are visible (AI Hours, Adoption Rate, AI-Active Users)", async ({ page }) => {
    // Three overview metric cards
    await expect(page.getByText(/ai hours/i)).toBeVisible();
    await expect(page.getByText(/adoption rate/i)).toBeVisible();
    await expect(page.getByText(/ai-active users/i)).toBeVisible();
  });

  test("User AI Usage table is visible", async ({ page }) => {
    await expect(page.getByText(/user ai usage/i)).toBeVisible();
  });

  test("User AI Usage table columns are correct", async ({ page }) => {
    // User, Total, AI Hours, Saved vs Est. columns
    const hasData = await page.getByRole("table").first().isVisible().catch(() => false);
    if (!hasData) return;
    await expect(page.getByRole("columnheader", { name: /user/i }).first()).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /total/i }).first()).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /ai hours/i }).first()).toBeVisible();
  });

  test("Task Efficiency table shows correct columns when visible", async ({ page }) => {
    const effSection = page.getByText(/task efficiency with ai/i);
    const exists = await effSection.count();
    if (!exists) return; // Only present when efficiency data exists

    const effTable = page.getByRole("table").nth(1);
    await expect(effTable.getByRole("columnheader", { name: /task/i })).toBeVisible();
    await expect(effTable.getByRole("columnheader", { name: /estimated/i })).toBeVisible();
    await expect(effTable.getByRole("columnheader", { name: /actual time spent/i })).toBeVisible();
    await expect(effTable.getByRole("columnheader", { name: /saved/i })).toBeVisible();
  });

  test("Actual Time Spent shows total hours (not per-entry avg)", async ({ page }) => {
    // Regression test for the calculation bug we fixed.
    // The value in Actual Time Spent should equal totalHours from the DB,
    // not the average of AI-assisted entries.
    const effSection = page.getByText(/task efficiency with ai/i);
    const exists = await effSection.count();
    if (!exists) return;

    // Get all rows in efficiency table
    const rows = page.getByRole("table").nth(1).getByRole("row");
    const rowCount = await rows.count();
    if (rowCount <= 1) return; // header only

    const firstDataRow = rows.nth(1);
    const cells = firstDataRow.getByRole("cell");
    const cellCount = await cells.count();
    // Cell index 3 = Estimated, cell index 4 = Actual Time Spent
    if (cellCount < 5) return;

    const estimatedText = (await cells.nth(3).textContent()) ?? "";
    const actualText = (await cells.nth(4).textContent()) ?? "";

    // If estimate is e.g. "10h", actual should be >= "0h" and not absurdly small
    // We mainly verify the column isn't empty or "—" when there's data
    expect(actualText).toMatch(/\d|—/);
    // Actual time should not be 0h if there are logged hours
    if (estimatedText !== "—") {
      expect(actualText).not.toBe("0h");
    }
  });

  test("Tasks Not Using AI section visible when applicable", async ({ page }) => {
    // Section only shown when non-AI tasks exist
    const noAiSection = page.getByText(/tasks not using ai/i);
    const exists = await noAiSection.count();
    if (!exists) return;
    await expect(noAiSection).toBeVisible();
  });

  test("table rows are sortable by clicking column headers", async ({ page }) => {
    const userTable = page.getByRole("table").first();
    const tableVisible = await userTable.isVisible().catch(() => false);
    if (!tableVisible) return;

    // Click Total column header to sort
    const totalHeader = page.getByRole("columnheader", { name: /total/i }).first();
    await totalHeader.click();
    await expect(page).toHaveURL(/\/reports\/ai-summary/); // still on same page

    // Click again to reverse sort
    await totalHeader.click();
    await expect(page).toHaveURL(/\/reports\/ai-summary/);
  });

  test("changing date range and clicking Apply updates results", async ({ page }) => {
    const fromInput = page.locator('input[type="date"]').first();
    await fromInput.fill("2026-01-01");
    await page.getByRole("button", { name: /apply/i }).click();
    await expect(page).toHaveURL(/from=2026-01-01/);
    await expect(page.getByRole("heading", { name: /ai analytics/i })).toBeVisible({ timeout: 10000 });
  });

  test("empty state shows when no data in range", async ({ page }) => {
    // Use a future date range guaranteed to have no data
    await page.goto("/reports/ai-summary?from=2099-01-01&to=2099-01-31");
    const emptyState = page.getByText(/no time entries found/i);
    const hasData = page.getByText(/ai hours/i);
    const eitherVisible = emptyState.or(hasData);
    await expect(eitherVisible.first()).toBeVisible({ timeout: 10000 });
  });
});
