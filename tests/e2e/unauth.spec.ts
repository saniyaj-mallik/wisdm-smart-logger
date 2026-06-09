import { test, expect } from "@playwright/test";

// Tests run WITHOUT stored auth state (chromium-unauth project)

test.describe("Unauthenticated redirects", () => {
  test("visiting /dashboard redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login", { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });

  test("visiting /logs redirects to /login", async ({ page }) => {
    await page.goto("/logs");
    await page.waitForURL("**/login", { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });

  test("visiting /projects redirects to /login", async ({ page }) => {
    await page.goto("/projects");
    await page.waitForURL("**/login", { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });

  test("visiting /profile redirects to /login", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForURL("**/login", { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });

  test("visiting /admin redirects to /login", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL("**/login", { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });
});
