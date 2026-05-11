/**
 * Auth tests — login, register, logout, and route protection.
 * These tests intentionally bypass the saved storageState for some cases.
 */
import { test, expect } from "@playwright/test";
import { TEST_USER } from "../../playwright.config";

// ── Login page ────────────────────────────────────────────────────────────────
test.describe("Login page", () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // unauthenticated

  test("renders login form correctly", async ({ page }) => {
    await page.goto("/login");
    // CardTitle renders as <div>, not a heading element
    await expect(page.getByText("Smart Logger")).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.getByRole("link", { name: /register/i })).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[name="email"]').fill("notreal@example.com");
    await page.locator('input[name="password"]').fill("wrongpassword");
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows error on empty password", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[name="email"]').fill("someone@example.com");
    // submit without password — browser HTML5 validation fires
    await page.locator('button[type="submit"]').click();
    // still on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects to dashboard on valid login", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[name="email"]').fill(TEST_USER.email);
    await page.locator('input[name="password"]').fill(TEST_USER.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForFunction(
      () => window.location.pathname.startsWith("/dashboard"),
      { timeout: 20000 }
    );
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

// ── Register page ──────────────────────────────────────────────────────────────
test.describe("Register page", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("renders registration form correctly", async ({ page }) => {
    await page.goto("/register");
    // CardTitle and submit button both say "Create account" — use CardDescription instead
    await expect(page.getByText("Join WisdmLabs Smart Logger")).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });

  test("shows error when name is too short (Zod v4)", async ({ page }) => {
    await page.goto("/register");
    await page.locator('input[name="name"]').fill("A");
    await page.locator('input[name="email"]').fill("newuser@example.com");
    await page.locator('input[name="password"]').fill("ValidPass1!");
    await page.locator('button[type="submit"]').click();
    // Zod validation error is rendered as <p class="text-xs text-destructive">
    await expect(page.locator('p.text-destructive').first()).toBeVisible({ timeout: 8000 });
  });

  test("shows error when email already registered", async ({ page }) => {
    await page.goto("/register");
    await page.locator('input[name="name"]').fill("Already Registered");
    await page.locator('input[name="email"]').fill(TEST_USER.email);
    await page.locator('input[name="password"]').fill("ValidPass1!");
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText(/email already registered/i)).toBeVisible({ timeout: 8000 });
  });

  test("link to login page works", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("link", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

// ── Protected routes ────────────────────────────────────────────────────────
test.describe("Route protection", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  const protectedRoutes = [
    "/dashboard",
    "/logs",
    "/projects",
    "/reports/summary",
    "/reports/team",
    "/reports/ai-summary",
    "/reports/block-generator",
    "/profile",
    "/admin/users",
  ];

  for (const route of protectedRoutes) {
    test(`unauthenticated access to ${route} redirects to login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/, { timeout: 15000 });
    });
  }
});

// ── Logout ────────────────────────────────────────────────────────────────────
test.describe("Logout", () => {
  test("clicking logout redirects to login page", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    // Logout button is an icon-only button — find by the LogOut SVG class
    await page.locator('button:has(svg.lucide-log-out)').click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
