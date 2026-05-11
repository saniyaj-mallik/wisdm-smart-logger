/**
 * Profile page — view account details, update display name, password change validation.
 */
import { test, expect } from "@playwright/test";
import { TEST_USER } from "../../playwright.config";

test.describe("Profile page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByRole("heading", { name: /profile/i })).toBeVisible({ timeout: 15000 });
  });

  test("page description is visible", async ({ page }) => {
    await expect(page.getByText(/update your account details/i)).toBeVisible();
  });

  test("Account Settings card is visible", async ({ page }) => {
    await expect(page.getByText(/account settings/i)).toBeVisible();
  });

  test("user email is displayed", async ({ page }) => {
    await expect(page.getByText(TEST_USER.email)).toBeVisible();
  });

  test("Display name field is pre-filled with current name", async ({ page }) => {
    const nameInput = page.getByLabel(/display name/i);
    await expect(nameInput).toBeVisible();
    const value = await nameInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test("Current password field is visible", async ({ page }) => {
    await expect(page.getByLabel(/current password/i)).toBeVisible();
  });

  test("New password field is visible", async ({ page }) => {
    await expect(page.getByLabel(/new password/i)).toBeVisible();
  });

  test("Save Changes button is visible", async ({ page }) => {
    await expect(page.getByRole("button", { name: /save changes/i })).toBeVisible();
  });

  test("can update display name successfully", async ({ page }) => {
    const nameInput = page.getByLabel(/display name/i);
    await nameInput.fill("E2E Test User");
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(page.getByText(/profile updated successfully/i)).toBeVisible({ timeout: 10000 });
  });

  test("shows error when new password provided without current password", async ({ page }) => {
    await page.getByLabel(/new password/i).fill("NewPass123!");
    // Don't fill current password
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(page.getByText(/current password required/i)).toBeVisible({ timeout: 8000 });
  });

  test("shows error when wrong current password is entered", async ({ page }) => {
    await page.getByLabel(/current password/i).fill("wrongpassword999");
    await page.getByLabel(/new password/i).fill("NewPass123!");
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(page.getByText(/incorrect|invalid|wrong|current password/i)).toBeVisible({ timeout: 8000 });
  });

  test("can change password with correct current password", async ({ page }) => {
    await page.getByLabel(/current password/i).fill(TEST_USER.password);
    await page.getByLabel(/new password/i).fill(TEST_USER.password); // keep same for idempotency
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(page.getByText(/profile updated successfully/i)).toBeVisible({ timeout: 10000 });
  });
});
