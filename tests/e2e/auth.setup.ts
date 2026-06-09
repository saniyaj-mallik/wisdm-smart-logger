import { test as setup, expect } from "@playwright/test";
import path from "path";

const TEST_EMAIL = "e2e-test@smart-logger.test";
const TEST_PASSWORD = "TestPass@123";
const AUTH_FILE = path.join(__dirname, ".auth/user.json");

setup("authenticate", async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[name="email"]', TEST_EMAIL);
  await page.fill('input[name="password"]', TEST_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 15_000 });
  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().storageState({ path: AUTH_FILE });
});
