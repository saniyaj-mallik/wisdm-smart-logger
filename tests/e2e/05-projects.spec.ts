/**
 * Projects list page — card grid, create project modal, navigation to detail.
 */
import { test, expect } from "@playwright/test";

const UNIQUE_TAG = `E2E-${Date.now()}`;

test.describe("Projects list page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/projects");
    await expect(page.getByRole("heading", { name: /projects/i })).toBeVisible({ timeout: 15000 });
  });

  test("page heading and description are visible", async ({ page }) => {
    await expect(page.getByText(/all projects and their tasks/i)).toBeVisible();
  });

  test("New Project button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /new project/i })).toBeVisible();
  });

  test("project cards or empty state are shown", async ({ page }) => {
    const cards = page.locator('[class*="card"], [class*="Card"]');
    const cardCount = await cards.count();
    if (cardCount === 0) {
      await expect(page.getByText(/no projects/i)).toBeVisible();
    } else {
      await expect(cards.first()).toBeVisible();
    }
  });

  test("New Project modal opens with correct fields", async ({ page }) => {
    await page.getByRole("button", { name: /new project/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByLabel(/name/i)).toBeVisible();
    await expect(dialog.getByLabel(/client/i)).toBeVisible();
    await expect(dialog.getByLabel(/budget/i)).toBeVisible();
  });

  test("New Project modal validates empty name", async ({ page }) => {
    await page.getByRole("button", { name: /new project/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Submit without filling name
    await dialog.getByRole("button", { name: /create/i }).click();
    // Should stay open (validation prevents close)
    await expect(dialog).toBeVisible();
  });

  test("New Project modal closes on Cancel", async ({ page }) => {
    await page.getByRole("button", { name: /new project/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe("Projects - Create and Navigate flow", () => {
  test("can create a project and see it in the list", async ({ page }) => {
    await page.goto("/projects");
    const projectName = `Test Project ${UNIQUE_TAG}`;

    await page.getByRole("button", { name: /new project/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByLabel(/name/i).fill(projectName);
    await dialog.getByRole("button", { name: /create/i }).click();

    // Modal closes and project appears in list
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(projectName)).toBeVisible({ timeout: 10000 });
  });

  test("clicking a project card navigates to project detail", async ({ page }) => {
    await page.goto("/projects");
    const firstCard = page.locator('a[href*="/projects/"]').first();
    const count = await firstCard.count();
    if (count === 0) {
      test.skip();
      return;
    }
    await firstCard.click();
    await expect(page).toHaveURL(/\/projects\/[a-f0-9]+/, { timeout: 15000 });
  });
});
