import { test, expect } from "@playwright/test";

// Tests run WITH stored auth state (chromium project — user is logged in)

test.describe("Logged-in user redirect away from auth pages", () => {
  test("visiting /login while logged in redirects to /dashboard", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
    expect(page.url()).toContain("/dashboard");
  });

  test("visiting /register while logged in redirects to /dashboard", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
    expect(page.url()).toContain("/dashboard");
  });
});

test.describe("Session persistence (no spurious logout)", () => {
  test("session survives multiple page navigations", async ({ page }) => {
    // Start on dashboard
    await page.goto("/dashboard");
    expect(page.url()).toContain("/dashboard");

    // Navigate to logs
    await page.goto("/logs");
    expect(page.url()).toContain("/logs");

    // Navigate to profile
    await page.goto("/profile");
    expect(page.url()).toContain("/profile");

    // Navigate to projects
    await page.goto("/projects");
    expect(page.url()).toContain("/projects");

    // Come back to dashboard — should still be logged in
    await page.goto("/dashboard");
    expect(page.url()).toContain("/dashboard");
    // Should not have been redirected to /login
    expect(page.url()).not.toContain("/login");
  });

  test("hard reload does not log the user out", async ({ page }) => {
    await page.goto("/dashboard");
    await page.reload();
    await page.waitForURL(/\/(dashboard)/, { timeout: 10_000 });
    expect(page.url()).toContain("/dashboard");
    expect(page.url()).not.toContain("/login");
  });

  test("navigating back to /login after reload still redirects to /dashboard", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.reload();
    await page.goto("/login");
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
    expect(page.url()).toContain("/dashboard");
  });
});
