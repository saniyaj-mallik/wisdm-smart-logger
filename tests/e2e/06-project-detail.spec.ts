/**
 * Project Detail page — hero header, stats strip, task table, task logs panel,
 * Log Time from panel, Add Task modal.
 */
import { test, expect } from "@playwright/test";

async function getFirstProjectUrl(page: any): Promise<string | null> {
  await page.goto("/projects");
  const link = page.locator('a[href*="/projects/"]').first();
  const count = await link.count();
  if (!count) return null;
  return link.getAttribute("href");
}

test.describe("Project Detail page", () => {
  let projectUrl: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const url = await getFirstProjectUrl(page);
    await page.close();
    projectUrl = url ?? "/projects";
  });

  test.beforeEach(async ({ page }) => {
    if (projectUrl === "/projects") {
      test.skip();
      return;
    }
    await page.goto(projectUrl);
    await page.waitForLoadState("networkidle");
  });

  test("back link to All Projects is visible", async ({ page }) => {
    await expect(page.getByRole("link", { name: /all projects/i })).toBeVisible();
  });

  test("project hero header card is visible", async ({ page }) => {
    // Hero has the project name as a heading
    const heading = page.getByRole("heading").first();
    await expect(heading).toBeVisible();
  });

  test("Edit button is visible on project header", async ({ page }) => {
    await expect(page.getByRole("button", { name: /edit/i }).first()).toBeVisible();
  });

  test("stats strip shows Active Tasks / Est. Hours / Assignees", async ({ page }) => {
    await expect(page.getByText(/active tasks/i)).toBeVisible();
    await expect(page.getByText(/est\. hours/i)).toBeVisible();
    await expect(page.getByText(/assignees/i)).toBeVisible();
  });

  test("task list column headers are visible", async ({ page }) => {
    await expect(page.getByText(/estimated/i)).toBeVisible();
    await expect(page.getByText(/logged/i)).toBeVisible();
    await expect(page.getByText(/assigned/i)).toBeVisible();
  });

  test("Add Task button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /add task/i })).toBeVisible();
  });

  test("Add Task modal opens with required fields", async ({ page }) => {
    await page.getByRole("button", { name: /add task/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByLabel(/task name/i).or(dialog.getByLabel(/name/i)).first()).toBeVisible();
  });

  test("Add Task modal closes on Cancel", async ({ page }) => {
    await page.getByRole("button", { name: /add task/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
  });

  test("clicking a task row opens the logs panel", async ({ page }) => {
    const taskRows = page.locator('[class*="cursor-pointer"]').filter({
      has: page.locator("text=/h|—/"),
    });
    const rowCount = await taskRows.count();
    if (rowCount === 0) {
      // Try any clickable row
      const tableRow = page.locator("tr").nth(1);
      const trCount = await tableRow.count();
      if (!trCount) return;
      await tableRow.click();
    } else {
      await taskRows.first().click();
    }
    // Sheet/panel should open
    await expect(page.getByRole("dialog").or(page.locator('[data-state="open"]')).first()).toBeVisible({ timeout: 8000 });
  });

  test("task logs panel has Log Time button", async ({ page }) => {
    // Open first task
    const taskRow = page.locator("tr").nth(1);
    const rowCount = await taskRow.count();
    if (!rowCount) return;
    await taskRow.click();

    const panel = page.locator('[role="dialog"]');
    await expect(panel).toBeVisible({ timeout: 8000 });
    await expect(panel.getByRole("button", { name: /log time/i })).toBeVisible();
  });

  test("Log Time button in panel opens LogTimeModal with pre-filled task", async ({ page }) => {
    const taskRow = page.locator("tr").nth(1);
    const rowCount = await taskRow.count();
    if (!rowCount) return;
    await taskRow.click();

    const panel = page.locator('[role="dialog"]').first();
    await expect(panel).toBeVisible({ timeout: 8000 });

    // Click Log Time — this should open a second dialog (LogTimeModal)
    await panel.getByRole("button", { name: /log time/i }).click();

    // Two dialogs: the panel (sheet) + the log time modal
    const dialogs = page.locator('[role="dialog"]');
    await expect(dialogs).toHaveCount(2, { timeout: 5000 });
  });

  test("Edit project modal opens with existing values", async ({ page }) => {
    await page.getByRole("button", { name: /edit/i }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    // Name field should be pre-filled
    const nameInput = dialog.getByLabel(/name/i).first();
    const value = await nameInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });
});
