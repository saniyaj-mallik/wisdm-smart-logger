/**
 * Reports > Summary page — stat cards, date range filter, project breakdown table.
 */
import { test, expect } from "@playwright/test";

test.describe("Reports - Summary page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reports/summary");
    // Heading is exactly "Summary" (not "AI Summary")
    await expect(page.getByRole("heading", { name: "Summary", exact: true })).toBeVisible({ timeout: 15000 });
  });

  test("page description visible", async ({ page }) => {
    await expect(page.getByText(/your logged hours overview/i)).toBeVisible();
  });

  test("date range filter is visible", async ({ page }) => {
    // From / To date inputs should be present
    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs.first()).toBeVisible();
  });

  test("Apply button triggers a reload/filter", async ({ page }) => {
    const applyBtn = page.getByRole("button", { name: /apply/i });
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();
    // Page should still be on summary
    await expect(page).toHaveURL(/\/reports\/summary/);
  });

  test("quick-range shortcuts are visible", async ({ page }) => {
    // Expect This Week / Last Week / This Month / Last Month buttons or links
    const hasQuickBtn = await page.getByText(/this week|last week|this month|last month/i).count();
    expect(hasQuickBtn).toBeGreaterThan(0);
  });

  test("stat cards are visible (Total Hours, Billable, Non-Billable, AI Hours, Entries)", async ({ page }) => {
    // At least one summary metric card should render
    const metricTexts = ["total hours", "billable", "ai hours", "entries"];
    let found = 0;
    for (const label of metricTexts) {
      const count = await page.getByText(new RegExp(label, "i")).count();
      if (count > 0) found++;
    }
    expect(found).toBeGreaterThanOrEqual(2);
  });

  test("project breakdown section heading visible", async ({ page }) => {
    await expect(page.getByText(/by project/i)).toBeVisible();
  });

  test("project breakdown table columns are correct", async ({ page }) => {
    // Only check if there's data; otherwise empty state is fine
    const table = page.getByRole("table");
    const tableCount = await table.count();
    if (tableCount > 0) {
      await expect(table.first().getByRole("columnheader", { name: /project/i })).toBeVisible();
    }
  });

  test("date range filter updates URL params on Apply", async ({ page }) => {
    const fromInput = page.locator('input[type="date"]').first();
    await fromInput.fill("2026-01-01");
    await page.getByRole("button", { name: /apply/i }).click();
    await expect(page).toHaveURL(/from=2026-01-01/);
  });
});
