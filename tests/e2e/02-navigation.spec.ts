/**
 * Navigation tests — sidebar, active states, and inter-page routing.
 */
import { test, expect } from "@playwright/test";

test.describe("Sidebar navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("sidebar is visible on dashboard", async ({ page }) => {
    // Sidebar should be present
    await expect(page.locator("nav, aside").first()).toBeVisible();
  });

  test("navigates to My Logs", async ({ page }) => {
    await page.getByRole("link", { name: /my logs/i }).click();
    await expect(page).toHaveURL(/\/logs/);
  });

  test("navigates to All Projects", async ({ page }) => {
    await page.getByRole("link", { name: /all projects/i }).click();
    await expect(page).toHaveURL(/\/projects/);
  });

  test("navigates to Summary report", async ({ page }) => {
    // Use exact text or href to avoid matching "AI Summary"
    await page.locator('a[href="/reports/summary"]').click();
    await expect(page).toHaveURL(/\/reports\/summary/);
  });

  test("navigates to Team Overview", async ({ page }) => {
    await page.getByRole("link", { name: /team overview/i }).click();
    await expect(page).toHaveURL(/\/reports\/team/);
  });

  test("navigates to Block Generator", async ({ page }) => {
    await page.getByRole("link", { name: /block generator/i }).click();
    await expect(page).toHaveURL(/\/reports\/block-generator/);
  });

  test("navigates to AI Summary", async ({ page }) => {
    await page.getByRole("link", { name: /ai summary/i }).click();
    await expect(page).toHaveURL(/\/reports\/ai-summary/);
  });

  test("admin user can see Users admin link", async ({ page }) => {
    await expect(page.getByRole("link", { name: /users/i })).toBeVisible();
  });

  test("navigates to Admin Users", async ({ page }) => {
    await page.getByRole("link", { name: /users/i }).click();
    await expect(page).toHaveURL(/\/admin\/users/);
  });

  test("profile link navigates to profile page", async ({ page }) => {
    // Profile is an icon-only Link in the sidebar footer — select by href
    await page.locator('a[href="/profile"]').click();
    await expect(page).toHaveURL(/\/profile/);
  });

  test("dashboard link is active (highlighted) on dashboard page", async ({ page }) => {
    // The active link should have a distinct visual style
    const dashboardLink = page.getByRole("link", { name: /^dashboard$/i });
    await expect(dashboardLink).toBeVisible();
    // Active link class contains text-primary or border-primary
    const cls = await dashboardLink.getAttribute("class") ?? "";
    const parentCls = await dashboardLink.locator("..").getAttribute("class") ?? "";
    expect(cls + parentCls).toMatch(/primary|active/i);
  });
});

test.describe("Page headers", () => {
  const pages = [
    { path: "/dashboard", heading: /dashboard/i },
    // /logs uses a calendar view with month-year label, no "My Logs" h1
    { path: "/projects", heading: /projects/i },
    { path: "/reports/summary", heading: /summary/i },
    { path: "/reports/team", heading: /team overview/i },
    // Title is "Block Report Generator"
    { path: "/reports/block-generator", heading: /block report generator/i },
    { path: "/reports/ai-summary", heading: /ai analytics/i },
    { path: "/profile", heading: /profile/i },
    { path: "/admin/users", heading: /users/i },
  ];

  for (const { path, heading } of pages) {
    test(`${path} has correct page heading`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible({ timeout: 15000 });
    });
  }
});
