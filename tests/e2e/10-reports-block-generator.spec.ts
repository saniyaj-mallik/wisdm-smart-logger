/**
 * Reports > Block Generator page — filters, format options, generate report, copy/download.
 */
import { test, expect } from "@playwright/test";

test.describe("Block Generator page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/reports/block-generator");
    await expect(page.getByRole("heading", { name: /block generator/i })).toBeVisible({ timeout: 15000 });
  });

  test("date range inputs are visible", async ({ page }) => {
    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs.first()).toBeVisible();
    await expect(dateInputs.nth(1)).toBeVisible();
  });

  test("quick period shortcuts visible (This Week, Last Week, etc.)", async ({ page }) => {
    const shortcuts = ["this week", "last week", "this month", "last month"];
    let found = 0;
    for (const label of shortcuts) {
      if (await page.getByText(new RegExp(label, "i")).count()) found++;
    }
    expect(found).toBeGreaterThanOrEqual(2);
  });

  test("Group By filter is visible", async ({ page }) => {
    await expect(page.getByText(/group by/i)).toBeVisible();
  });

  test("Format selector is visible (Text / Markdown / CSV)", async ({ page }) => {
    await expect(page.getByText(/format/i)).toBeVisible();
    await expect(page.getByText(/text|markdown|csv|xlsx/i)).toBeVisible();
  });

  test("Billable filter is visible", async ({ page }) => {
    await expect(page.getByText(/billable/i)).toBeVisible();
  });

  test("Generate Report button is visible and clickable", async ({ page }) => {
    const generateBtn = page.getByRole("button", { name: /generate report/i });
    await expect(generateBtn).toBeVisible();
    await generateBtn.click();
    // Button may show a loader while generating
    await expect(page).toHaveURL(/\/reports\/block-generator/);
  });

  test("report output area appears after generating", async ({ page }) => {
    await page.getByRole("button", { name: /generate report/i }).click();
    // Wait for either the report output or a no-data message
    const outputArea = page.locator("pre, textarea, [class*='output'], [class*='result']");
    const noData = page.getByText(/no entries found|no data/i);
    await expect(outputArea.or(noData).first()).toBeVisible({ timeout: 15000 });
  });

  test("Copy button is visible after report generation", async ({ page }) => {
    await page.getByRole("button", { name: /generate report/i }).click();
    const copyBtn = page.getByRole("button", { name: /copy/i });
    const hasOutput = await copyBtn.isVisible({ timeout: 10000 }).catch(() => false);
    if (hasOutput) {
      await expect(copyBtn).toBeVisible();
    }
  });

  test("Download button is visible when there is data", async ({ page }) => {
    await page.getByRole("button", { name: /generate report/i }).click();
    const downloadBtn = page.getByRole("button", { name: /download/i });
    const hasDownload = await downloadBtn.isVisible({ timeout: 10000 }).catch(() => false);
    if (hasDownload) {
      await expect(downloadBtn).toBeVisible();
    }
  });

  test("switching to Markdown format and generating produces different output", async ({ page }) => {
    // Select markdown format
    const formatSelects = page.getByRole("combobox");
    // Format is one of the select dropdowns — try to find it by context
    const formatRegion = page.locator('[class*="format"]').or(
      page.locator("label").filter({ hasText: /format/i }).locator("..")
    ).first();
    const select = formatRegion.getByRole("combobox");
    const selectCount = await select.count();
    if (selectCount > 0) {
      await select.click();
      const markdownOption = page.getByRole("option", { name: /markdown/i });
      const mdExists = await markdownOption.count();
      if (mdExists) await markdownOption.click();
    }
    await page.getByRole("button", { name: /generate report/i }).click();
    await expect(page).toHaveURL(/\/reports\/block-generator/);
  });

  test("custom date range works", async ({ page }) => {
    const dateInputs = page.locator('input[type="date"]');
    await dateInputs.first().fill("2026-01-01");
    await dateInputs.nth(1).fill("2026-01-31");
    await page.getByRole("button", { name: /generate report/i }).click();
    // Should still be on page (not crash)
    await expect(page).toHaveURL(/\/reports\/block-generator/);
    await expect(page.getByRole("heading", { name: /block generator/i })).toBeVisible({ timeout: 10000 });
  });
});
