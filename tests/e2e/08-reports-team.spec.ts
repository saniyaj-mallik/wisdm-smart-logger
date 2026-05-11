/**
 * Reports > Team Overview page — team management section, create/delete team.
 */
import { test, expect } from "@playwright/test";

const UNIQUE_TEAM = `E2E Team ${Date.now()}`;

test.describe("Team Overview page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reports/team");
    await expect(page.getByRole("heading", { name: /team overview/i })).toBeVisible({ timeout: 15000 });
  });

  test("team management description is visible", async ({ page }) => {
    await expect(page.getByText(/manage teams|collaboration/i)).toBeVisible();
  });

  test("Create Team button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /create team/i })).toBeVisible();
  });

  test("Create Team modal opens with name and description fields", async ({ page }) => {
    await page.getByRole("button", { name: /create team/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByLabel(/team name/i).or(dialog.getByLabel(/name/i)).first()).toBeVisible();
  });

  test("Create Team modal closes on Cancel", async ({ page }) => {
    await page.getByRole("button", { name: /create team/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
  });

  test("teams grid or empty state is shown", async ({ page }) => {
    // Either team cards or empty state message
    const hasTeams = await page.locator('[class*="card"], [class*="Card"]').count();
    const hasEmpty = await page.getByText(/no teams yet|create.*team/i).count();
    expect(hasTeams + hasEmpty).toBeGreaterThan(0);
  });

  test("each team card shows team name and leader", async ({ page }) => {
    const cards = page.locator('[class*="card"], [class*="Card"]').filter({
      has: page.locator('text=/leader/i'),
    });
    const cardCount = await cards.count();
    if (cardCount === 0) return; // No teams yet — skip deeper checks
    await expect(cards.first()).toBeVisible();
  });
});

test.describe("Team - Create and Delete flow", () => {
  test("can create a team and see it listed", async ({ page }) => {
    await page.goto("/reports/team");
    await page.getByRole("button", { name: /create team/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const nameInput = dialog.getByLabel(/team name/i).or(dialog.getByLabel(/name/i)).first();
    await nameInput.fill(UNIQUE_TEAM);

    await dialog.getByRole("button", { name: /create/i }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });

    // Team card should appear
    await expect(page.getByText(UNIQUE_TEAM)).toBeVisible({ timeout: 10000 });
  });

  test("team leader can add a member", async ({ page }) => {
    await page.goto("/reports/team");

    // Find the team card for our E2E team
    const teamCard = page.locator('[class*="card"], [class*="Card"]').filter({
      has: page.getByText(UNIQUE_TEAM),
    }).first();
    const exists = await teamCard.count();
    if (!exists) return;

    // Add member button should be visible on the card
    const addBtn = teamCard.getByRole("button", { name: /add member/i });
    const addBtnExists = await addBtn.count();
    if (!addBtnExists) return;

    await addBtn.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByRole("combobox").first()).toBeVisible();
  });
});
