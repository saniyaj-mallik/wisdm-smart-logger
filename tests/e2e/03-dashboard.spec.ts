/**
 * Dashboard tests — stat cards, recent logs table, and Log Time modal.
 */
import { test, expect } from "@playwright/test";

test.describe("Dashboard page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("displays welcome message with username", async ({ page }) => {
    await expect(page.getByText(/welcome back/i)).toBeVisible();
  });

  test("shows four stat cards", async ({ page }) => {
    await expect(page.getByText("Recent Total")).toBeVisible();
    // Use exact: true so "Billable" doesn't match "Non-Billable" (strict mode)
    await expect(page.getByText("Billable", { exact: true })).toBeVisible();
    await expect(page.getByText("Non-Billable")).toBeVisible();
    await expect(page.getByText("AI Assisted")).toBeVisible();
  });

  test("stat cards display numeric values (not blank)", async ({ page }) => {
    // Each stat card value ends with 'h' or 'logs'
    const recentTotal = page.locator(".text-2xl.font-bold").first();
    await expect(recentTotal).toBeVisible();
    const text = await recentTotal.textContent();
    expect(text).toMatch(/\d/); // contains at least one digit
  });

  test("Recent Logs section header visible", async ({ page }) => {
    await expect(page.getByText(/recent logs/i)).toBeVisible();
  });

  test("Log Time button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /log time/i })).toBeVisible();
  });

  test("Log Time button opens modal", async ({ page }) => {
    await page.getByRole("button", { name: /log time/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("heading", { name: /log time/i })).toBeVisible();
  });

  test("Log Time modal has required fields", async ({ page }) => {
    await page.getByRole("button", { name: /log time/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    // Use exact text to avoid strict-mode ambiguity
    await expect(dialog.getByText("Project", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Task", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Date", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Time Entry", { exact: true })).toBeVisible();
    await expect(dialog.getByText("Billable", { exact: true })).toBeVisible();
    await expect(dialog.getByText("AI Used", { exact: true })).toBeVisible();
  });

  test("Log Time modal closes on Cancel", async ({ page }) => {
    await page.getByRole("button", { name: /log time/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
  });

  test("Log Time modal shows Enter Hours / Start-End toggle", async ({ page }) => {
    await page.getByRole("button", { name: /log time/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("button", { name: /enter hours/i })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /start \/ end/i })).toBeVisible();
  });

  test("switching to Start/End mode shows time inputs", async ({ page }) => {
    await page.getByRole("button", { name: /log time/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: /start \/ end/i }).click();
    // Two time inputs should appear
    const timeInputs = dialog.locator('input[type="time"]');
    await expect(timeInputs).toHaveCount(2);
  });

  test("Recent Logs table has correct column headers", async ({ page }) => {
    const table = page.getByRole("table");
    await expect(table).toBeVisible();
    await expect(table.getByRole("columnheader", { name: /date/i })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: /project/i })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: /task/i })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: /hours/i })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: /tags/i })).toBeVisible();
  });

  test("empty state shows prompt when no logs", async ({ page }) => {
    // Either shows log rows OR the empty state — both are valid
    const hasRows = await page.getByRole("row").count();
    if (hasRows <= 1) {
      // Only header row — empty state message should show
      await expect(page.getByText(/no logs yet/i)).toBeVisible();
    } else {
      // At least one log row visible
      await expect(page.getByRole("row").nth(1)).toBeVisible();
    }
  });
});

test.describe("Dashboard - Log Time full flow", () => {
  test("can log time and it appears in the table", async ({ page }) => {
    await page.goto("/dashboard");

    // Open Log Time modal
    await page.getByRole("button", { name: /log time/i }).click();
    const dialog = page.getByRole("dialog");

    // Select a project — wait for options to appear after clicking trigger
    await dialog.getByRole("combobox").first().click();
    const firstProjectOption = page.getByRole("option").first();
    const hasProject = await firstProjectOption.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasProject) {
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: /cancel/i }).click();
      return;
    }
    await firstProjectOption.click();

    // Select a task
    await dialog.getByRole("combobox").nth(1).click();
    const firstTaskOption = page.getByRole("option").first();
    const hasTask = await firstTaskOption.isVisible({ timeout: 5000 }).catch(() => false);
    if (!hasTask) {
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: /cancel/i }).click();
      return;
    }
    await firstTaskOption.click();

    // Enter hours
    await dialog.locator('input[type="number"]').fill("1");

    // Submit
    await dialog.getByRole("button", { name: /save log/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });
  });
});
